<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps<{
  show: boolean;
}>();

defineEmits(["close"]);

const eventLog = ref<string[]>([]);
const socket = ref<WebSocket | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
let messageId = 1;

const connectToHA = async () => {
  loading.value = true;
  error.value = null;
  eventLog.value = [];

  try {
    // 1. Fetch entities to watch
    // const response = await fetch("api/monitor-entities");
    // if (!response.ok) {
    //   throw new Error("Failed to fetch entities to monitor.");
    // }
    const WATCH_LIST = [
      "binary_sensor.kinconya16_0101_pi2",
      "binary_sensor.kinconya16_0101_pi3",
      "binary_sensor.kinconya16_0101_pi4",
      "binary_sensor.kinconya16_0101_pi5",
      "binary_sensor.kinconya16_0101_pi6",
      "binary_sensor.kinconya16_0101_pi7",
      "binary_sensor.kinconya16_0101_pi8",
      "binary_sensor.kinconya16_0101_pi9",
      "binary_sensor.kinconya16_0101_pi10",
      "binary_sensor.kinconya16_0101_pi11",
      "binary_sensor.kinconya16_0101_pi12",
      "binary_sensor.kinconya16_0101_pi13",
      "binary_sensor.kinconya16_0101_pi14",
      "binary_sensor.kinconya16_0101_pi15",
      "binary_sensor.kinconya16_0101_pi16",
      "binary_sensor.sw_01_pi1",
    ];

    if (!WATCH_LIST || WATCH_LIST.length === 0) {
      eventLog.value.push("No entities found to monitor.");
      loading.value = false;
      return;
    }
    eventLog.value.push(`Monitoring ${WATCH_LIST.length} entities...`);

    // 2. Get token and URL from runtime config
    const config = useRuntimeConfig();
    const token = config.public.supervisorToken;
    const wsUrl = "wss://hass.sal.net.br/api/websocket";

    if (!token) {
      throw new Error(
        "Supervisor token is not available in public runtime config.",
      );
    }

    // 3. Connect WebSocket
    socket.value = new WebSocket(wsUrl);

    // 4. Handle WebSocket messages
    socket.value.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      eventLog.value.push(msg);
      if (msg.type === "auth_required") {
        socket.value?.send(
          JSON.stringify({
            type: "auth",
            access_token: token,
          }),
        );
      } else if (msg.type === "auth_ok") {
        eventLog.value.push(
          "Authentication successful. Subscribing to events...",
        );
        socket.value?.send(
          JSON.stringify({
            id: messageId++,
            type: "subscribe_events",
            event_type: "state_changed",
          }),
        );
      } else if (
        msg.type === "event" &&
        msg.event.event_type === "state_changed"
      ) {
        const entityId = msg.event.data.entity_id;
        const newState = msg.event.data.new_state;
        if (WATCH_LIST.includes(entityId)) {
          const logEntry = `[${new Date().toLocaleTimeString()}] Entity: ${entityId}, New State: ${newState.state}`;
          eventLog.value.push(logEntry);
        }
      }
    };

    socket.value.onopen = () => {
      eventLog.value.push(
        "WebSocket connection opened, waiting for authentication...",
      );
    };

    socket.value.onerror = (err) => {
      console.error("WebSocket Error:", err);
      error.value = "Failed to connect to Home Assistant WebSocket.";
    };

    socket.value.onclose = () => {
      eventLog.value.push("WebSocket connection closed.");
    };
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const disconnectFromHA = () => {
  if (socket.value) {
    socket.value.close();
    socket.value = null;
  }
};

watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      connectToHA();
    } else {
      disconnectFromHA();
    }
  },
);

onUnmounted(() => {
  disconnectFromHA();
});
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
  >
    <div
      class="bg-[#2b2b2b] w-full max-w-5xl rounded-lg shadow-2xl border border-gray-700 flex flex-col h-[85vh]"
    >
      <div
        class="flex justify-between items-center p-6 border-b border-gray-700"
      >
        <h3 class="text-xl font-semibold text-white flex items-center">
          <Icon icon="mdi:monitor-dashboard" class="mr-2 text-esphome-accent" />
          Monitor Stream
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white">
          <Icon icon="mdi:close" class="text-2xl" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div class="animate-fade-in">
          <div
            class="bg-gray-900/50 p-4 rounded-lg border border-gray-700 h-full"
          >
            <pre
              class="text-sm text-gray-300 font-mono whitespace-pre-wrap h-full overflow-y-auto custom-scrollbar"
              >{{ eventLog.join("\n") }}</pre
            >
          </div>
        </div>
      </div>

      <div
        class="p-6 border-t border-gray-700 bg-[#363636] flex justify-end gap-3 rounded-b-lg"
      >
        <button
          @click="$emit('close')"
          class="px-5 py-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded transition-colors text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-in-out;
  height: 100%;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #2b2b2b;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #4b5563;
  border-radius: 20px;
}
</style>
