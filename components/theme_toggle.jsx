import {
  Center,
  IconButton,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaRegMoon, FaSun } from "react-icons/fa";

export default function ThemeToggle() {
  const { toggleColorMode } = useColorMode();

  return (
    <Center>
      <IconButton
        h={0}
        top="3rem"
        left="8rem"
        variant="ghost"
        zIndex="popover"
        color={useColorModeValue("brand.light", "brand.dark")}
        _hover={{ bg: "none", transform: "scale(1.5)", opacity: 0.7 }}
        title={`${useColorModeValue("Dark", "Light")} mode`}
        onClick={toggleColorMode}
        icon={useColorModeValue(<FaSun />, <FaRegMoon />)}
      />
    </Center>
  );
}
