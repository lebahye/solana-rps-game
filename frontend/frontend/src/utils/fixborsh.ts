import * as borsh from 'borsh';
import { Buffer } from 'buffer';

// Create a borsh struct helper function
export const struct = (fields: Array<{ key: string, type: string }>) => {
  // Check if borsh.struct exists natively
  if (typeof borsh.struct === 'function') {
    // Convert our field format to borsh's format
    const borshFields = fields.map(field => [field.key, field.type]);
    return borsh.struct(borshFields);
  }

  // Fallback implementation if borsh.struct doesn't exist
  return {
    encode: (value: any, buffer: Buffer): number => {
      let offset = 0;

      fields.forEach(field => {
        const fieldValue = value[field.key];

        switch (field.type) {
          case 'u8':
            buffer.writeUInt8(fieldValue, offset);
            offset += 1;
            break;
          case 'u16':
            buffer.writeUInt16LE(fieldValue, offset);
            offset += 2;
            break;
          case 'u32':
            buffer.writeUInt32LE(fieldValue, offset);
            offset += 4;
            break;
          case 'u64':
            // For big numbers like u64, we need to handle them carefully
            if (typeof fieldValue === 'bigint') {
              const buf = Buffer.alloc(8);
              buf.writeBigUInt64LE(fieldValue, 0);
              buf.copy(buffer, offset);
            } else if (typeof fieldValue === 'number') {
              const buf = Buffer.alloc(8);
              buf.writeBigUInt64LE(BigInt(fieldValue), 0);
              buf.copy(buffer, offset);
            }
            offset += 8;
            break;
          default:
            throw new Error(`Unsupported type: ${field.type}`);
        }
      });

      return offset;
    },

    // Add decode if needed
    decode: (buffer: Buffer): any => {
      const result: any = {};
      let offset = 0;

      fields.forEach(field => {
        switch (field.type) {
          case 'u8':
            result[field.key] = buffer.readUInt8(offset);
            offset += 1;
            break;
          case 'u16':
            result[field.key] = buffer.readUInt16LE(offset);
            offset += 2;
            break;
          case 'u32':
            result[field.key] = buffer.readUInt32LE(offset);
            offset += 4;
            break;
          case 'u64':
            result[field.key] = buffer.readBigUInt64LE(offset);
            offset += 8;
            break;
          default:
            throw new Error(`Unsupported type: ${field.type}`);
        }
      });

      return result;
    }
  };
};

// Safe deserialize function
export function safeDeserialize(schema: any, classType: any, data: Buffer): any {
  try {
    return borsh.deserialize(schema, classType, data);
  } catch (error) {
    console.error('Error deserializing data:', error);
    // Return a default instance with minimal data
    return new classType({});
  }
}
