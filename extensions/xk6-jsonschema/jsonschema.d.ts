declare module "k6/x/jsonschema" {

  export interface ValidationError {
    keywordLocation: string;
    absoluteKeywordLocation: string;
    instanceLocation: string;
    message: string;
    causes: ValidationError[];
    toString(): string;
  }

  export interface Schema {
    validate(data: any): ValidationError | null;
  }

  export default function(path: string): Schema
}

