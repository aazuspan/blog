import { extendTheme } from "@chakra-ui/react";

export default extendTheme({
  styles: {
    global: (props) => {
      const brand = props.colorMode === "dark" ? "brand.dark" : "brand.light";

      return {
        body: {
          transition: "color, background-color 0.5s ease !important",
          paddingLeft: "1rem",
          paddingRight: "1rem",
        },
        a: {
          color: `${brand} !important`,
          transition: "color, opacity 0.3s ease !important",
          _hover: {
            textDecoration: "none !important",
            opacity: "0.7"
          },
        },
      };
    },
  },
  colors: {
    brand: {
      light: "rgb(74, 165, 200)",
      dark: "#faa2ae",
    },
  },
  fonts: {
    heading: "Outfit, sans-serif",
    body: "Quicksand, sans-serif",
  },
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
});
