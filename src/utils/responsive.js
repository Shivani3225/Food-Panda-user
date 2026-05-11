import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const wp = (percentage) => (width * percentage) / 100;
export const hp = (percentage) => (height * percentage) / 100;
