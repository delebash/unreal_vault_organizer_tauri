export const manifestUtils = {
  num2blob(num, targetLength) {
    let blob = "";
    while (num) {
      let part = num & 0xFF;
      num = num >> 8;
      blob = blob + part.toString().padStart(3, '0');
    }
    return blob.padEnd(targetLength, '0');
  },
  bigInt2blob(bigIntValue, reverse = false) {

    const byteLength = 8;
    const buffer = Buffer.alloc(byteLength);
    for (let i = 0; i < byteLength; i++) {
      buffer[byteLength - 1 - i] = Number(bigIntValue >> BigInt(8 * i) & BigInt(0xFF));
    }

    let blob = '';
    for (let i = 0; i < buffer.length; i++) {
      const decimalString = buffer[i].toString().padStart(3, '0');
      blob += decimalString;
    }

    if (reverse) {
      let sets = this.splitStr(blob, 3);
      sets.reverse();
      blob = '';
      for (let val of sets) {
        blob += val;
      }
    }

    return blob;
  },
  splitStr(str, splitLength = 1) {
    let sets = [];
    for (let i = 0, charsLength = str.length; i < charsLength; i += splitLength) {
      sets.push(str.substring(i, i + splitLength));
    }
    return sets;
  },

  hex2bin(hexSource) {

    const bin = Buffer.from(hexSource, 'hex').toString();
    return bin;

  },

  bin2hex(binSource) {
    const hex = Buffer.from(binSource, 'utf8').toString("hex");
    return hex;
  },


  dec2hex(dec) { //integer to hex
    let hex = parseInt(dec).toString(16);
    if (hex.length == 1) {
      hex = '0' + hex; //adds leading zero
    }
    return hex;
  },

  hex2dec(hex, bigStr = false) {
    //returns string, used for long ints or int if false
    return (bigStr) ? BigInt('0x' + hex).toString(10) : parseInt(hex, 16)
  },

  hex2blob(hexString, reverse = false) {
    const buffer = Buffer.from(hexString, 'hex');
    let blob = '';

    for (let i = 0; i < buffer.length; i++) {
      const decimalString = buffer[i].toString().padStart(3, '0');
      blob = decimalString + blob;
    }

    return blob;
  },

  blob2num(blobStr) {
    let num = 0;
    let shift = 0;

    for (let i = 0; i < blobStr.length; i += 3) {
      const part = parseInt(blobStr.substring(i, i + 3), 10);
      num += (part << shift);
      shift += 8;
    }

    return num;
  },
}
