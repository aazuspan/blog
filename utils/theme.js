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
          fontSize: "1.2rem",
        },
        a: {
          color: `${brand} !important`,
          _hover: {
            textDecoration: "none !important",
            opacity: "0.7",
            transform: "scale(1.05)",
          },
        },
        li: {
          marginBottom: "0.5rem",
          marginLeft: "1rem",
        },
        "img, iframe": {
          marginTop: "1.4rem",
          marginBottom: "1.4rem",
        },
        iframe: {
          width: "100%",
        },
        h1: {
          fontSize: "1.8rem !important",
          fontWeight: "900 !important"
        },
        h2: {
          fontSize: "1.7rem !important",
        },
        h3: {
          fontSize: "1.5rem !important",
        },
        h4: {
          fontSize: "1.3rem !important",
        },
      };
    },
  },
  components: {
    Heading: {
      baseStyle: props => ({
        color: props.colorMode === "dark" ? "gray.300" : "gray.600",
        fontWeight: "400",
        paddingTop: 2,
        fontVariant: "small-caps",
      }),
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
    useSystemColorMode: true,
  },
});
