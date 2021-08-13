import { KC, SS } from "./const.ts";

const char2word = (c: number[], off: number): number => {
  return (c[off + 0] & 0xffffffff) << 24 |
    (c[off + 1] & 0xffffffff) << 16 |
    (c[off + 2] & 0xffffffff) << 8 |
    (c[off + 3] & 0xffffffff) << 0;
};

const word2char = (inp: number, out: number[], off: number): void => {
  out[off + 0] = (inp >>> 24) & 0xff;
  out[off + 1] = (inp >>> 16) & 0xff;
  out[off + 2] = (inp >>> 8) & 0xff;
  out[off + 3] = (inp >>> 0) & 0xff;
};

const SeedG = (val: number): number => {
  return SS[3][(val >>> 24) & 0xff] ^
    SS[2][(val >>> 16) & 0xff] ^
    SS[1][(val >>> 8) & 0xff] ^
    SS[0][(val >>> 0) & 0xff];
};

const SeedRoundKey = (userKey: number[]) => {
  let A = char2word(userKey, 0);
  let B = char2word(userKey, 4);
  let C = char2word(userKey, 8);
  let D = char2word(userKey, 12);

  const roundKey = [];
  for (let i = 0; i < 16; i++) {
    roundKey[i * 2 + 0] = SeedG(A + C - KC[i]);
    roundKey[i * 2 + 1] = SeedG(B - D + KC[i]);

    if (i % 2 == 0) {
      const T0 = A;
      A = (A >>> 8) | (B << 24);
      B = (B >>> 8) | (T0 << 24);
    } else {
      const T0 = C;
      C = (C << 8) | (D >>> 24);
      D = (D << 8) | (T0 >>> 24);
    }
  }
  return roundKey;
};

const SeedEncrypt = (
  roundKey: number[],
  inputData: number[],
): number[] => {
  let L0 = char2word(inputData, 0);
  let L1 = char2word(inputData, 4);
  let R0 = char2word(inputData, 8);
  let R1 = char2word(inputData, 12);

  for (let i = 0; i < 16; i++) {
    let T0 = R0 ^ roundKey[i * 2 + 0];
    let T1 = R1 ^ roundKey[i * 2 + 1];

    T1 ^= T0;
    T1 = SeedG(T1);
    T0 += T1;
    T0 = SeedG(T0);
    T1 += T0;
    T1 = SeedG(T1);
    T0 += T1;

    L0 ^= T0;
    L1 ^= T1;

    [L0, R0] = [R0, L0];
    [L1, R1] = [R1, L1];
  }

  const out = new Array(16);
  word2char(R0, out, 0);
  word2char(R1, out, 4);
  word2char(L0, out, 8);
  word2char(L1, out, 12);

  return out;
};

const SeedDecrypt = (
  roundKey: number[],
  inputData: number[],
): number[] => {
  let L0 = char2word(inputData, 0);
  let L1 = char2word(inputData, 4);
  let R0 = char2word(inputData, 8);
  let R1 = char2word(inputData, 12);

  for (let i = 15; i >= 0; i--) {
    let T0 = R0 ^ roundKey[i * 2 + 0];
    let T1 = R1 ^ roundKey[i * 2 + 1];

    T1 ^= T0;
    T1 = SeedG(T1);
    T0 += T1;
    T0 = SeedG(T0);
    T1 += T0;
    T1 = SeedG(T1);
    T0 += T1;
    L0 ^= T0;
    L1 ^= T1;

    [L0, R0] = [R0, L0];
    [L1, R1] = [R1, L1];
  }

  const out = new Array(16);
  word2char(R0, out, 0);
  word2char(R1, out, 4);
  word2char(L0, out, 8);
  word2char(L1, out, 12);

  return out;
};

export { SeedDecrypt, SeedEncrypt, SeedRoundKey };
