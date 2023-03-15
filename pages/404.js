import { AbsoluteCenter } from "@chakra-ui/react";
import Layout from "../components/layout";

export default function Custom404() {
  return (
    <Layout title="404 - Page Not Found">
      <AbsoluteCenter textAlign="center">I couldn't find that page...</AbsoluteCenter>
    </Layout>
  );
}
