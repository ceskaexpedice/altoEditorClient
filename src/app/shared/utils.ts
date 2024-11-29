import { XmlJsElement } from "./xml-js-element";

export class Utils {
    public static prettifyXml(sourceXml: string) {
        var xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml');
        var xsltDoc = new DOMParser().parseFromString([
            // describes how we want to modify the XML - indent everything
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">',
            '  <xsl:output method="xml" version="1.0" encoding="UTF-8" omit-xml-declaration="yes" indent="yes" />',
            '  <xsl:strip-space elements="*"/>',
            '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
            '    <xsl:value-of select="normalize-space(.)"/>',
            '  </xsl:template>',
            '  <xsl:template match="node()|@*">',
            '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
            '  </xsl:template>',
            '</xsl:stylesheet>',
        ].join('\n'), 'application/xml');

        // var xsltDoc = new DOMParser().parseFromString([
        //     '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">',
        //     '<xsl:output method="xml" version="1.0" encoding="UTF-8" omit-xml-declaration="no" indent="yes"/>',
        //     '<xsl:template match="/"><xsl:copy-of select="."/></xsl:template>',
        //     '</xsl:stylesheet>'].join('\n'), 'application/xml');

        var xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xsltDoc);
        var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
        var resultXml = new XMLSerializer().serializeToString(resultDoc);
        return resultXml;
    }

    public static getElementByPos(printSpace: XmlJsElement, hpos: string, vpos: string): XmlJsElement {
        for (let i = 0; i < printSpace.elements.length; i++) {
            const tb: XmlJsElement = printSpace.elements[i];
            for (let idx = 0; idx < tb.elements.length; idx++) {
                const line: XmlJsElement = tb.elements[idx];
                for (let widx = 0; widx < line.elements.length; widx++) {
                    const word: XmlJsElement = line.elements[widx];
                    if ((word.attributes['HPOS'] === hpos) && (word.attributes['VPOS'] === vpos)) {
                        return word;
                    }
                }
            }
        }
        return null;
    }

}