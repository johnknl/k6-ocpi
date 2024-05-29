declare module "k6/x/fs" {

  interface FileObjectModule {
    read(path: string): string;
    readBytes(path: string): ArrayBuffer;
    remove(path: string): void;
    rename(oldPath: string, newPath: string): void;
    exists(path: string): boolean;
    write(path: string, data: string): void;
    writeBytes(path: string, data: ArrayBuffer): void;
    append(path: string, data: string): void;
    appendBytes(path: string, data: ArrayBuffer): void;
    update(path: string, fn: (data: string) => string): void;
    updateBytes(path: string, fn: (data: ArrayBuffer) => ArrayBuffer): void;
  }

  export default {} as FileObjectModule;
}

