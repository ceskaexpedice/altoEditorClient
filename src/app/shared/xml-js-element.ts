import { Attributes } from "xml-js";

export interface XmlJsElement {
    attributes?: {[key: string]: string};
    type: string;
    name: string;
    idx?: number;
    elements: XmlJsElement[];
}
