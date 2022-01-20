import * as avro from 'avsc';

const tagsParser = avro.Type.forSchema({
  type: 'array',
  items: avro.Type.forSchema({
    type: 'record',
    name: 'Tag',
    fields: [
      { name: 'name', type: 'string' },
      { name: 'value', type: 'string' },
    ],
  }),
});

export interface Tag {
  name: string;
  value: string;
}

export function decodeTagsFromByteArray(byteArray: Uint8Array): Tag[] {
  return tagsParser.fromBuffer(Buffer.from(byteArray));
}

export function encodeTagsToByteArray(tags: Tag[]): Uint8Array {
  return tagsParser.toBuffer(tags);
}
