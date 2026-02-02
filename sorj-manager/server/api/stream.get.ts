// server/api/stream.get.ts
import WebSocket from "ws";
import { H3Event } from "h3";
import { useRuntimeConfig } from "#imports";

export default defineEventHandler(async (event: H3Event) => {
  // 1. Configurar cabeçalhos para SSE (Server-Sent Events)
  setHeader(event, "Content-Type", "text/event-stream");
  setHeader(event, "Cache-Control", "no-cache");
  setHeader(event, "Connection", "keep-alive");
  const config = useRuntimeConfig();
  // Lista de entidades que você quer monitorar
  const WATCH_LIST = get_monitored_entities();
  console.log(WATCH_LIST);

  const token = config.supervisorToken;
  const wsUrl = "ws://supervisor/core/websocket";

  // 2. Conectar ao WebSocket do Supervisor (lado do servidor)
  const haSocket = new WebSocket(wsUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // 3. Quando conectar, pedir para assinar eventos de mudança de estado
  haSocket.on("open", () => {
    // ID deve ser incremental, mas para este exemplo simples fixamos em 1
    haSocket.send(
      JSON.stringify({
        id: 1,
        type: "subscribe_events",
        event_type: "state_changed",
      }),
    );
  });

  // 4. Quando receber dados do HA, filtrar e enviar para o navegador
  haSocket.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // Verifica se é um evento de mudança de estado
      if (msg.type === "event" && msg.event.event_type === "state_changed") {
        const entityId = msg.event.data.entity_id;
        const newState = msg.event.data.new_state;

        // FILTRO: Só avisa o navegador se for uma entidade da sua lista
        if (WATCH_LIST.includes(entityId)) {
          // Formato SSE: "data: {json}\n\n"
          const chunk = `data: ${JSON.stringify({ entity_id: entityId, state: newState })}\n\n`;
          event.node.res.write(chunk);
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
