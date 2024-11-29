import {manifestUtils} from './manifestUtils.js'
import {readFile, readTextFile} from '@tauri-apps/plugin-fs';
import pako from "pako";
import {utils} from "src/utils/utils.js";

export const manifest = {

  async parseData(path) {

    try {
      const json = await readTextFile(path);
      return JSON.parse(json);
    } catch (err) {
      //continue if cannot read json file assuming it is binary, log any other error
      if (!err.includes('failed to read file')) {
        utils.showErrorMessage(`Error parsing JSON manifest from ${err}`)
      }
    }

    try {
      return await this.parseBinary(path);
    } catch (err) {
      if (err.includes('failed to read file')) {
        utils.showErrorMessage(`Error parsing binary manifest from ${err}`)
      }
    }

  },
  async parseBinary(path) {
    try {
      const contents = await readFile(path);
      let data = Buffer.from(contents)
      let manifest = await this.manifestBinaryHandler(data);
      return manifest;
    } catch (err) {
      console.log(`Error parsing BIN manifest from ${err}`);
    }
  },
  async manifestBinaryHandler(data) {

    let manifestData;
    let manifestObj = {};
    let parsed;

    try {
      parsed = await this.parseManifest(data);

      if (parsed.storedAs) {
        manifestData = await this.decompressData(parsed.data);
      } else {
        manifestData = parsed.data;
      }
    } catch (err) {
      console.log(`Error handling binary manifest: ${err}`);
      return {};
    }

    manifestData = Buffer.from(manifestData)
    const meta = await this.parseManifestMeta(manifestData);
    manifestData = manifestData.slice(meta.metaSize);
    const cdl = await this.parseCDL(manifestData);
    manifestData = manifestData.slice(cdl.size);
    const fml = await this.parseFML(manifestData);
    manifestData = manifestData.slice(fml.size);

    manifestObj = {
      ManifestFileVersion: manifestUtils.num2blob(meta.featureLevel, 12),
      bIsFileData: meta.isFileData,
      AppID: meta.appId,
      AppNameString: meta.appName,
      BuildVersionString: meta.buildVersion,
      LaunchExeString: meta.launchExe,
      LaunchCommand: meta.launchCommand,
      PrereqIds: meta.prereqIds,
      PrereqName: meta.prereqName,
      PrereqPath: meta.prereqPath,
      PrereqArgs: meta.prereqArgs,
      FileManifestList: [],
      ChunkHashList: {},
      ChunkShaList: {},
      DataGroupList: {},
      ChunkFilesizeList: {},
      CustomFields: {}
    };

    for (const cd of cdl.elements) {
      const guid = cd.guid.map(g => g.toString(16).padStart(8, '0')).join("").toUpperCase();
      manifestObj.ChunkHashList[guid] = manifestUtils.bigInt2blob(cd.hash, true);
      manifestObj.ChunkShaList[guid] = cd.sha_hash.toString('hex');
      manifestObj.DataGroupList[guid] = cd.group_num.toString().padStart(3, '0');
    }

    for (const fm of fml.elements) {

      let chunkParts = [];

      for (const cp of fm.chunk_parts) {
        const cpguid = cp.guid.map(g => g.toString(16).padStart(8, '0')).join("").toUpperCase();
        chunkParts.push({
          Guid: cpguid,
          Offset: manifestUtils.num2blob(cp.offset, 12),
          Size: manifestUtils.num2blob(cp.size, 12)
        });
      }

      manifestObj.FileManifestList.push({
        Filename: fm.filename,
        FileHash: manifestUtils.hex2blob(fm.hash.toString('hex')),
        FileChunkParts: chunkParts
      });
    }

    return manifestObj;

  },
  async parseManifest(buffer) {
    let offset = 0;

    // Header Magic
    const headerMagic = buffer.readUInt32LE(offset);
    offset += 4;
    /*
    if (headerMagic !== 0x44BEC00C) {
        throw new Error('Invalid Manifest: No header magic!');
    }
    */

    // Header Size
    const headerSize = buffer.readUInt32LE(offset);
    offset += 4;

    // Size Uncompressed
    const sizeUncompressed = buffer.readUInt32LE(offset);
    offset += 4;

    // Size Compressed
    const sizeCompressed = buffer.readUInt32LE(offset);
    offset += 4;

    // SHA-1 Hash
    const shaHash = buffer.slice(offset, offset + 20);
    offset += 20;

    // Stored As
    const storedAs = buffer.readUInt8(offset);
    offset += 1;

    // Version
    const version = buffer.readUInt32LE(offset);
    offset += 4;

    // Data
    const data = buffer.slice(offset);
    return {
      headerMagic,
      headerSize,
      sizeUncompressed,
      sizeCompressed,
      shaHash,
      storedAs,
      version,
      data,
    };
  },
  async parseManifestMeta(buffer) {
    let offset = 0;
    const meta = {
      metaSize: buffer.readUInt32LE(offset),
      dataVersion: buffer.readUInt8(offset + 4),
      featureLevel: buffer.readUInt32LE(offset + 5),
      isFileData: buffer.readUInt8(offset + 9) === 1,
      appId: buffer.readUInt32LE(offset + 10),
      appName: '',
      buildVersion: '',
      launchExe: '',
      launchCommand: '',
      prereqIds: [],
      prereqName: '',
      prereqPath: '',
      prereqArgs: '',
      uninstallActionPath: '',
      uninstallActionArgs: '',
      buildId: '',
    };

    offset += 14;
    let result = this.readFString(buffer, offset);
    meta.appName = result.str;
    offset = result.newOffset;

    result = this.readFString(buffer, offset);
    meta.buildVersion = result.str;
    offset = result.newOffset;

    result = this.readFString(buffer, offset);
    meta.launchExe = result.str;
    offset = result.newOffset;

    result = this.readFString(buffer, offset);
    meta.launchCommand = result.str;
    offset = result.newOffset;

    const entries = buffer.readUInt32LE(offset);
    offset += 4;

    for (let i = 0; i < entries; i++) {
      result = this.readFString(buffer, offset);
      meta.prereqIds.push(result.str);
      offset = result.newOffset;
    }

    result = this.readFString(buffer, offset);
    meta.prereqName = result.str;
    offset = result.newOffset;

    result = this.readFString(buffer, offset);
    meta.prereqPath = result.str;
    offset = result.newOffset;

    result = this.readFString(buffer, offset);
    meta.prereqArgs = result.str;
    offset = result.newOffset;

    if (meta.dataVersion >= 1) {
      result = this.readFString(buffer, offset);
      meta.buildId = result.str;
      offset = result.newOffset;
    }

    if (meta.dataVersion >= 2) {
      result = this.readFString(buffer, offset);
      meta.uninstallActionPath = result.str;
      offset = result.newOffset;

      result = this.readFString(buffer, offset);
      meta.uninstallActionArgs = result.str;
      offset = result.newOffset;
    }

    return meta;
  },
  async decompressData(data) {
    try {
      const uncompressed = pako.inflate(data);
      return uncompressed;
    } catch (err) {
      console.error(`Error decompressing binary manifest: ${err}`);
      throw err;
    }
  },
  async parseCDL(buffer) {

    let offset = 0;
    const cdl = {
      version: 0,
      size: 0,
      count: 0,
      elements: [],
      _manifest_version: 18,
      _guid_map: null,
      _guid_int_map: null,
      _path_map: null
    };

    cdl.size = buffer.readUInt32LE(offset);
    offset += 4;
    cdl.version = buffer.readUInt8(offset);
    offset += 1;
    cdl.count = buffer.readUInt32LE(offset);
    offset += 4;

    for (let i = 0; i < cdl.count; i++) {
      const element = {
        guid: null,
        hash: 0,
        sha_hash: null,
        group_num: 0,
        window_size: 0,
        file_size: 0
      };
      cdl.elements.push(element);
    }

    for (const element of cdl.elements) {
      element.guid = [
        buffer.readUInt32LE(offset),
        buffer.readUInt32LE(offset + 4),
        buffer.readUInt32LE(offset + 8),
        buffer.readUInt32LE(offset + 12)
      ];
      offset += 16;
    }

    for (const element of cdl.elements) {
      element.hash = buffer.readBigUInt64LE(offset);
      offset += 8;
    }

    for (const element of cdl.elements) {
      element.sha_hash = buffer.slice(offset, offset + 20);
      offset += 20;
    }

    for (const element of cdl.elements) {
      element.group_num = buffer.readUInt8(offset);
      offset += 1;
    }

    for (const element of cdl.elements) {
      element.window_size = buffer.readUInt32LE(offset);
      offset += 4;
    }

    for (const element of cdl.elements) {
      element.file_size = buffer.readBigInt64LE(offset);
      offset += 8;
    }

    return cdl;
  },
  async parseFML(buffer) {
    let offset = 0;
    const fml = {
      version: 0,
      size: 0,
      count: 0,
      elements: [],
    };

    fml.size = buffer.readUInt32LE(offset);
    offset += 4;

    fml.version = buffer.readUInt8(offset);
    offset += 1;

    fml.count = buffer.readUInt32LE(offset);
    offset += 4;

    for (let i = 0; i < fml.count; i++) {
      fml.elements.push({
        filename: '',
        symlink_target: '',
        hash: null,
        flags: 0,
        install_tags: [],
        chunk_parts: []
      });
    }

    fml.elements.forEach((elem) => {
      const filenameResult = this.readFString(buffer, offset);
      elem.filename = filenameResult.str;
      offset = filenameResult.newOffset;
    });

    fml.elements.forEach((elem) => {
      const symlinkResult = this.readFString(buffer, offset);
      elem.symlink_target = symlinkResult.str;
      offset = symlinkResult.newOffset;
    });

    fml.elements.forEach((elem) => {
      elem.hash = buffer.slice(offset, offset + 20);
      offset += 20;
    });

    fml.elements.forEach((elem) => {
      elem.flags = buffer.readUInt8(offset);
      offset += 1;
    });

    fml.elements.forEach((elem) => {
      const tagCount = buffer.readUInt32LE(offset);
      offset += 4;
      for (let i = 0; i < tagCount; i++) {
        const tagResult = this.readFString(buffer, offset);
        elem.install_tags.push(tagResult.str);
        offset = tagResult.newOffset;
      }
    });

    fml.elements.forEach((elem) => {
      const partCount = buffer.readUInt32LE(offset);
      offset += 4;
      let fileOffset = 0;

      for (let i = 0; i < partCount; i++) {
        const partSize = buffer.readUInt32LE(offset);
        offset += 4;
        const guid = [buffer.readUInt32LE(offset), buffer.readUInt32LE(offset + 4), buffer.readUInt32LE(offset + 8), buffer.readUInt32LE(offset + 12)];
        offset += 16;
        const chunkOffset = buffer.readUInt32LE(offset);
        offset += 4;
        const size = buffer.readUInt32LE(offset);
        offset += 4;
        elem.chunk_parts.push({
          guid,
          offset: chunkOffset,
          size,
          file_offset: fileOffset
        });

        fileOffset += size;
      }

    });

    if (fml.version >= 1) {
      fml.elements.forEach((elem) => {
        const hasMd5 = buffer.readUInt32LE(offset);
        offset += 4;
        if (hasMd5 !== 0) {
          elem.hash_md5 = buffer.slice(offset, offset + 16);
          offset += 16;
        }
      });

      fml.elements.forEach((elem) => {
        const mimeTypeResult = this.readFString(buffer, offset);
        elem.mime_type = mimeTypeResult.str;
        offset = mimeTypeResult.newOffset;
      });
    }

    if (fml.version >= 2) {
      fml.elements.forEach((elem) => {
        elem.hash_sha256 = buffer.slice(offset, offset + 32);
        offset += 32;
      });
    }

    fml.elements.forEach((elem) => {
      elem.file_size = elem.chunk_parts.reduce((acc, part) => acc + part.size, 0);
    });

    return fml;
  },
  readFString(buffer, offset) {
    let length = buffer.readInt32LE(offset);
    offset += 4;
    let str = '';
    if (length < 0) {
      length = Math.abs(length) * 2;
      str = buffer.toString('utf16le', offset, offset + length - 2);
      offset += length;
    } else if (length > 0) {
      str = buffer.toString('ascii', offset, offset + length - 1);
      offset += length;
    }
    return {
      str,
      newOffset: offset
    };
  },
  // async inflateAsync(){
  //   promisify(zlib.inflate);
  // }
}






