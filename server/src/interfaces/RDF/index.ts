export interface NamedNode {
  termType: string;
  value: string;
}

export interface Literal {
  termType: string;
  value: string;
  language: string;
  datatype: NamedNode;
}

export type RDFTerm = NamedNode | Literal;
