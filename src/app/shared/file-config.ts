
export interface Sort { label: string; field: string; dir: string; entity?: string[]};

export class FileConfig {
  def_author: string;
  def_recipient: string;
  replacements: {orig: string, dest: string}[];
}
