/// <reference path="../tamer-text-input/src/lynx-elements.d.ts" />
import * as Lynx from "@lynx-js/types";

declare module "@lynx-js/types" {
  interface IntrinsicElements extends Lynx.IntrinsicElements {
    svg: {
      content: string;
      style: string | Lynx.CSSProperties;
    };
  }
}