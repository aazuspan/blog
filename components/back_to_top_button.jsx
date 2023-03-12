import { BiArrowFromBottom } from "react-icons/bi";
import { Center, IconButton } from "@chakra-ui/react";
import { useColorModeValue, useTheme } from "@chakra-ui/react";

const scrollToTop = () => {
  if (window) window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

export default function BackToTopButton() {
  const theme = useTheme();
  const color = useColorModeValue(
    theme.colors.brand.light,
    theme.colors.brand.dark
  );

  return (
    <Center>
      <IconButton
        mt={4}
        icon={<BiArrowFromBottom fontSize="24px" fill={color} />}
        onClick={scrollToTop}
        variant="ghost"
        title="Back to top"
        _hover={{ backgroundColor: "transparent", transform: "scale(1.2)" }}
      />
    </Center>
  );
}
