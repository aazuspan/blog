import {
  Box,
  Button,
  Collapse,
  Stack,
  Text,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useState } from "react";
import { BsTags, BsTagsFill } from "react-icons/bs";

function TagButton({ tag, activeTags, setActiveTags }) {
  const active = activeTags.includes(tag);
  return (
    <WrapItem>
      <Button
        title={tag}
        variant="outline"
        isActive={active}
        size="sm"
        onClick={() => {
          if (active) {
            setActiveTags(activeTags.filter((t) => t !== tag));
          } else {
            setActiveTags([...activeTags, tag]);
          }
        }}
      >
        <Text>{tag}</Text>
      </Button>
    </WrapItem>
  );
}

export default function TagContainer({ tags, activeTags, setActiveTags }) {
  const [showTags, setShowTags] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        mt={3}
        size="sm"
        onClick={() => setShowTags(!showTags)}
        title={showTags ? "Hide tags" : "Filter by tag"}
      >
        <Box mr={2}>
          {activeTags.length > 0 ? <BsTagsFill /> : <BsTags/>}
        </Box>
        {showTags ? "Hide tags" : "Filter by tag"}
      </Button>
      <Collapse in={showTags}>
        <Stack mt={3} direction="column">
          <Wrap spacing={2}>
            {tags.map((tag) => (
              <TagButton
                key={tag}
                tag={tag}
                activeTags={activeTags}
                setActiveTags={setActiveTags}
              />
            ))}
          </Wrap>
        </Stack>
      </Collapse>
    </>
  );
}
