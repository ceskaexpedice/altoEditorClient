export interface AltoSP {
  HPOS: number,
  VPOS: number,
  WIDTH: number,
  ID: string
}

export interface AltoString {
  $: {
    HPOS: number,
    VPOS: number,
    WIDTH: number,
    HEIGHT: number,
    WC: number,
    CONTENT: string,
    ID: string
  },
  idx: number
}

export interface AltoLine {
  $: {
    HPOS: number,
    VPOS: number,
    WIDTH: number,
    HEIGHT: number,
    BASELINE: number,
    ID: string
  },
  SP: AltoSP[],
  String: AltoString[],
  idx: number
}


export interface AltoBlock {
  $: {
    HPOS: number,
    VPOS: number,
    WIDTH: number,
    HEIGHT: number,
    ID: string
  },
  TextLine: AltoLine[]
}

