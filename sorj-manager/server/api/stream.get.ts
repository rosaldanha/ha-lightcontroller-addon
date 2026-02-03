// server/api/stream.get.ts
import WebSocket from "ws";
import { H3Event, setResponseHeader, setResponseStatus } from "h3";
import { createApp, eventHandler, createEventStream } from "h3";
import { useRuntimeConfig } from "#imports";
import { getMonitoredEntities } from "../utils/getMonitoredEntities";

export default defineEventHandler(async (event: H3Event) => {
  // 1. Configurar cabeçalhos para SSE (Server-Sent Events)
  // Set the headers for SSE
  setResponseHeader(event, "Content-Type", "text/event-stream");
  setResponseHeader(event, "Cache-Control", "no-cache");
  setResponseHeader(event, "Connection", "keep-alive");
  setResponseStatus(event, 200);

  const eventStream = createEventStream(event);
  eventStream._path = "api/stream";
  const config = useRuntimeConfig();
  // Lista de entidades que você quer monitorar
  const WATCH_LIST = await getMonitoredEntities();
  console.log(WATCH_LIST);

  const token = config.supervisorToken;

  const wsUrl = "ws://supervisor/core/websocket";
  console.log(`Conectando com token`);
  // 2. Conectar ao WebSocket do Supervisor (lado do servidor)
  const haSocket = new WebSocket(wsUrl);
  console.log("conectado");
  console.log(WATCH_LIST);
  // 3. Quando conectar, pedir para assinar eventos de mudança de estado
  // haSocket.on("open", () => {
  //   // ID deve ser incremental, mas para este exemplo simples fixamos em 1
  //   haSocket.send(
  //     JSON.stringify({
  //       id: 1,
  //       type: "subscribe_events",
  //       event_type: "state_changed",
  //     }),
  //   );
  // });

  // 4. Quando receber dados do HA, filtrar e enviar para o navegador
  let count: number = 0;
  haSocket.on("message", (data: any) => {
    try {
      count += 1;
      const msg = JSON.parse(data.toString());
      //console.log(msg);
      if (msg.type === "auth_required") {
        haSocket.send(
          JSON.stringify({
            id: count,
            type: "auth",
            access_token: token,
          }),
        );
      }
      if (msg.type === "auth_ok") {
        haSocket.send(
          JSON.stringify({
            id: 1,
            type: "subscribe_events",
            event_type: "state_changed",
          }),
        );
        console.log("SENT event.node.res");

        //eventStream.push("Hello world");
        eventStream.push("Hello world");
        console.log(eventStream);
        //return eventStream.send();
        event._handled = true;
      }
      // Verifica se é um evento de mudança de estado
      if (msg.type === "event" && msg.event.event_type === "state_changed") {
        const entityId = msg.event.data.entity_id;
        const newState = msg.event.data.new_state;
        if (entityId.startsWith("binary_sensor.")) console.log(entityId);
        // FILTRO: Só avisa o navegador se for uma entidade da sua lista
        if (WATCH_LIST.includes(entityId)) {
          // Formato SSE: "data: {json}\n\n"
          console.log(`Found ${entityId}`);
          const chunk = `data: ${JSON.stringify({ entity_id: entityId, state: newState })}\n\n`;
          console.log(chunk);
          //event.node.res.write(chunk);
        }
      }
    } catch (e) {
      console.error("Erro ao processar mensagem do HA", e);
    }
  });

  // 5. Limpeza: Se o navegador fechar a aba, fecha a conexão com o HA
  event.node.req.on("close", () => {
    console.log("Navegador desconectou. Fechando socket com HA...");
    haSocket.close();
    event.node.res.end();
  });

  // Mantém a conexão aberta retornando uma promessa que nunca resolve
  // (ou até o cliente desconectar)
  return new Promise(() => {
    /* wait forever */
  });
});
