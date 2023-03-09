import { IconButton, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { FaRegMoon, FaSun } from "react-icons/fa";

export default function ThemeToggle() {
  const { toggleColorMode } = useColorMode();

  return (
    <IconButton
      top="2rem"
      left="8rem"
      variant="ghost"
      color={useColorModeValue("brand.light", "brand.dark")}
      _hover={{ bg: "none", transform: "scale(1.5)" }}
      title={`${useColorModeValue("Dark", "Light")} mode`}
      onClick={toggleColorMode}
      icon={useColorModeValue(<FaSun />, <FaRegMoon />)}
    ></IconButton>
  );
}
