+++
title = "Deploying Earth Engine Cloud Functions using IaC"
tags = ["python", "earth-engine", "cloud"]
description = "Using infrastructure-as-code to reproducibly deploy Earth Engine apps as serverless functions."
date = "2024-09-27"
+++

Running Earth Engine code as a serverless function is normally a [multi-step process](https://github.com/google/earthengine-api/blob/master/demos/cloud-functions/README.md#cloud-function-endpoint) that involves manually creating a service account through the web UI, downloading a credential file to zip with your code, and enabling and configuring a handful of APIs. It's a hassle *and* a great opportunity for human error with misconfigured services and accidentally committed credentials.

Infrastructure-as-code (IaC) allows you to set up, configure, and deploy cloud infrastructure programmatically instead of manually, turning complicated configuration instructions into easily reproducible scripts. 

To demonstrate, let's set up a [Google Cloud Run function](https://cloud.google.com/functions) to execute some Earth Engine code which we can trigger by visiting a URL, using an IaC tool called [Pulumi](https://www.pulumi.com/).

## The Infrastructure

Here's the Earth Engine code I want to run -- just a quick demo that returns the cloud cover[^pun] of the most recently ingested Landsat 9 image:

```python
import ee

def main():
    # TODO: Initialize Earth Engine

    now = datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000    
    last_cloud_cover = (
        ee.ImageCollection("LANDSAT/LC09/C02/T1")
        .filterDate(now - 172_800_000, now)
        .sort("system:time_start", False)
        .first()
        .get("CLOUD_COVER")
    )
    
    try:
        return f"The last Landsat 9 image was {last_cloud_cover.getInfo():.2f}% cloudy."
    except Exception as e:
        logging.error(e)
        return "No new Landsat 9 acquisitions in the last 48 hours..."
```

To run that in the cloud, we'll need:
- A cloud project with the necessary APIs enabled.
- A cloud storage bucket to hold the code.
- A cloud function to run the code.
- A service account to authenticate our function.

## The Code

You can see the full code and setup instructions [here](https://github.com/aazuspan/ee-serverless-demo), but I'll break down the important chunks below, all of which live in a `__main__.py` file at the project root.

### Enable APIs

Let's start by enabling the various APIs we'll need. Rather than clicking through these one by one in the web UI, we can set them up in one go by simply declaring the required services.

```python
import pulumi
import pulumi_gcp as gcp

earthengine = gcp.projects.Service("earthengine-api", service="earthengine.googleapis.com")
cloudbuild = gcp.projects.Service("cloudbuild-api", service="cloudbuild.googleapis.com")
cloudfunctions = gcp.projects.Service("cloudfunctions-api", service="cloudfunctions.googleapis.com")
run = gcp.projects.Service("run-api", service="run.googleapis.com")
```

*Note: You will still need to register the project in Earth Engine separately to specify whether it's a commercial or non-commercial project.*

### Create the Credentials

We'll need a service account to authenticate our cloud function. We can set up the account and an access key with:

```python
account = gcp.serviceaccount.Account(
    "service-account",
    account_id="demo-service-account",
    display_name="Demo Service Account"
)

key = gcp.serviceaccount.Key(
    "service-key",
    service_account_id=account.name,
)
```

Earth Engine can initialized from a service account using either a credential file or a credential string. To avoid the security risk of having to store and upload a secret file, we'll eventually pass the credentials as an environment variable to our cloud function. For now, we'll just update the function itself to load the key, and worry about exposing it later:

```python
def main(_):
    key_data = os.environ["SERVICE_ACCOUNT_KEY"]

    credentials = ee.ServiceAccountCredentials(None, key_data=key_data)
    ee.Initialize(credentials)
    ...
```

### Build the Bucket

In order to deploy a cloud function, it needs to be stored somewhere. We'll create a cloud bucket and a bucket object to store our code from the local `function` folder:

```python
# Create a GCS bucket to store cloud functions
bucket = gcp.storage.Bucket(
    "bucket",
    location="US",
)

# Write the zipped function to the cloud bucket
function_object = gcp.storage.BucketObject(
    "ee-function-source",
    bucket=bucket.name,
    source=pulumi.FileArchive("./function"),
)
```

### Export the Function

Finally, we can create the cloud function by specifying a Python runtime, the file name, the bucket where it's located, and the service account credentials to authenticate it. 

Pulumi builds infrastructure in parallel, so when one stage depends on another stage, that needs to be handled explicitly. In this case, we can only build a cloud function once we've successfully enabled the related APIs, so we'll mark those as dependencies using `opts`. Otherwise, the cloud function would fail to deploy the first time and would need to be re-deployed.

```python
function = gcp.cloudfunctionsv2.Function(
    "ee-function",
    location="us-central1",
    description="A demo serverless EE function",
    build_config={
        "runtime": "python311",
        "entry_point": "main",
        "source": {
            "storage_source": {
                "bucket": function_object.bucket,
                "object": function_object.name,
            },
        },
    },
    # Minimal config to reduce potential cost
    service_config={
        "max_instance_count": 1,
        "available_memory": "128Mi",
        "timeout_seconds": 5,
        # Expose the service account credentials to the function at runtime
        "environment_variables": {
            "SERVICE_ACCOUNT_KEY": key.private_key.apply(lambda k: base64.b64decode(k).decode()),
        }
    },
    # Wait for required APIs to enable before attempting to build to function
    opts=pulumi.ResourceOptions(depends_on=[cloudbuild, cloudfunctions, run]),
)
```

One last step is to (optionally) allow public access to our function, so that anyone can trigger it from the URL, which we'll export to the terminal for convenience:

```python
run_invoker = gcp.cloudrun.IamBinding(
    "run-invoker",
    location=function.location,
    service=function.name,
    role="roles/run.invoker",
    members=["allUsers"],
)

pulumi.export("function", function.url)
```

## Deploying

If everything is set up correctly, running `pulumi up` will build out the entire cloud infrastructure for the project, deploy the function, and print the URL where we can run it:

https://ee-function-38e19d5-225331302352.us-central1.run.app/

Clicking that link now gives us the cloud cover of the most recent Landsat 9 acquisition, computed in the cloud! 

When we're done, running `pulumi destroy` will deconstruct all of the infrastructure that it built, taking us back to a clean slate.

[^pun]: Pun fully intended.