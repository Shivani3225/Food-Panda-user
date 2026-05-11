import { Dimensions, PixelRatio } from "react-native";

const { width } = Dimensions.get("window");
const BASE_WIDTH = 375;

export const scale = (size) => (width / BASE_WIDTH) * size;
export const fontScale = (size) => scale(size) * PixelRatio.getFontScale();
