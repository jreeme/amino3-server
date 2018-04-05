import {Stream} from "stream";
import CallSite = NodeJS.CallSite;

const stackTracer = require('stack-tracer');

export class Util {
  static generateUUID() {
    let d = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      let r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  static kebabToCamel(name) {
    return name.replace(/(-|^)([a-z])/g, function (_, $1, $2) {
      return $2.toUpperCase();
    });
  }

  static camelToKebab(name) {
    return Util.camelToSnake(name, '-');
  }

  static camelToSnake(name, separator) {
    return name.replace(/([a-z]|(?:[A-Z]+))([A-Z]|$)/g, function (_, $1, $2) {
      return $1 + ($2 && (separator || '_') + $2);
    }).toLowerCase();
  }

  static checkCallback(cb: any) {
    return (typeof cb === 'function') ? cb : (() => {
    });
  }

  static getCallSite(index: number): any {
    return stackTracer(index);
  }

  static getCallingMethodFullName(index: number): string {
    return Util.getCallSite(index + 1).functionName;
  }

  static getCallingMethodName(index: number): string {
    let functionName = Util.getCallingMethodFullName(index + 1);
    return functionName.slice(functionName.indexOf('.') + 1);
  }

  static readLinesFromTextFile(input: Stream, func: (line: string) => void) {
    let remaining = '';
    input.on('data', function (data) {
      remaining += data;
      let index = remaining.indexOf('\n');
      let last = 0;
      while (index > -1) {
        const line = remaining.substring(last, index);
        last = index + 1;
        func(line);
        index = remaining.indexOf('\n', last);
      }
      remaining = remaining.substring(last);
    });
    input.on('end', function () {
      if (remaining.length > 0) {
        func(remaining);
      }
      func(null);
    });
  }

  static addTextLinesArrayToFile(readStream,
                                 writeStream,
                                 lineInsertionText: string,
                                 newLines: string[],
                                 cb: (err?) => void) {
    Util.readLinesFromTextFile(
      readStream,
      (line) => {
        if (line === null) {
          cb();
          return;
        }
        if (line.includes(lineInsertionText)) {
          newLines.forEach((newLine) => {
            writeStream.write(newLine);
          });
        } else {
          writeStream.write(line + '\n');
        }
      });
  }

}
