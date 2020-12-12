// 1. [x] Połaczyć po TCP
// 2. [x] Zaimplementować protokół RCON na połączeniu TCP

const net = require("net");

const PACKET_TYPE_RESPONSE = 0;
const PACKET_TYPE_COMMAND = 2;
const PACKET_TYPE_LOGIN = 3;

let nextRequestID = 1;

function encode_packet(type, payload) {
  let length = 4 + 4 + Buffer.byteLength(payload, "ascii") + 1 + 1;
  let requestID = nextRequestID;
  nextRequestID += 1;

  let buf = Buffer.alloc(4 + length); // length integer + length value
  buf.writeInt32LE(length, 0);
  buf.writeInt32LE(requestID, 4);
  buf.writeInt32LE(type, 8);
  buf.write(payload, 12, "ascii");

  return buf;
}

function decode_packet(buffer) {
  const length = buffer.readInt32LE(0);
  const requestID = buffer.readInt32LE(4);
  const type = buffer.readInt32LE(8);
  const payload = buffer.toString("ascii", 12, 12 + length - 4 - 4 - 1 - 1);

  return { length, requestID, type, payload };
}

function send(socket, type, payload) {
  const packet = encode_packet(type, payload);
  console.log(`send: ${JSON.stringify(decode_packet(packet))}`);
  socket.write(packet);
}

function main() {
  const socket = net.connect(27015, "127.0.0.1");

  socket.on("connect", () => {
    console.log("socket connected");

    send(socket, PACKET_TYPE_LOGIN, "123");
  });

  socket.on("close", () => {
    console.log("socket closed");
  });

  let opped = false;

  socket.on("data", (data) => {
    //console.log(`data: ${data}`);

    // WARNING: data does not have to contain the whole packet, we may receive it in several chunks

    // TODO: append data to a buffer and parse packets from that buffer when they become available
    const packet = decode_packet(data);
    console.log(`recv: ${JSON.stringify(packet)}`);

    if (!opped) {
      send(socket, PACKET_TYPE_COMMAND, "gamemode creative Emsa001");
      opped = true;
    }
  });

  socket.on("error", (error) => {
    console.log(`socket error: ${error}`);
  });
}

main();
