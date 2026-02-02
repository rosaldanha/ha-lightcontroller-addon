<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps<{
  show: boolean;
}>();

defineEmits(["close"]);

const entityStates = ref<{ [key: string]: any }>({});
const loading = ref(false);
const error = ref<string | null>(null);
const socket = ref<WebSocket | null>(null);
let messageId = 1;

const connectToHA = async (entityIds: string[]) => {
  const runtimeConfig = useRuntimeConfig();
  // @ts-ignore
  const haUrl = runtimeConfig.public.haUrl || window.location.host;
  // @ts-ignore
  const haToken = runtimeConfig.public.supervisorToken;

  if (!haToken) {
    error.value = "Home Assistant token is not configured.";
    return;
  }

  const wsUrl = `wss://${haUrl}/api/websocket`;
  socket.value = new WebSocket(wsUrl);

  socket.value.onmessage = (event) => {
    const message = JSON.parse(event.data);
    alert(event.data);

    if (message.type === "auth_required") {
      socket.value?.send(
        JSON.stringify({ type: "auth", access_token: haToken }),
      );
      alert(JSON.stringify({ type: "auth", access_token: haToken }));
    } else if (message.type === "auth_ok") {
      // 1. Get initial states
      socket.value?.send(
        JSON.stringify({ id: messageId++, type: "get_states" }),
      );
      // 2. Subscribe to future changes
      socket.value?.send(
        JSON.stringify({
          id: messageId++,
          type: "subscribe_events",
          event_type: "state_changed",
        }),
      );
    } else if (message.id === messageId - 2 && message.type === "result") {
      // Corresponds to get_states
      if (message.success) {
        for (const entity of message.result) {
          if (entityIds.includes(entity.entity_id)) {
            entityStates.value[entity.entity_id] = entity;
          }
        }
      }
    } else if (message.type === "event") {
      const eventData = message.event;
      if (
        eventData.event_type === "state_changed" &&
        entityIds.includes(eventData.data.entity_id)
      ) {
        entityStates.value[eventData.data.entity_id] = eventData.data.new_state;
      }
    }
  };

  socket.value.onopen = () => {
    console.log("WebSocket connection opened.");
  };

  socket.value.onerror = (err) => {
    console.error("WebSocket Error:", err);
    error.value = "Failed to connect to Home Assistant WebSocket.";
  };

  socket.value.onclose = () => {
    console.log("WebSocket connection closed.");
  };
};

const disconnectFromHA = () => {
  if (socket.value) {
    socket.value.close();
    socket.value = null;
  }
};

watch(
  () => props.show,
  async (newShow) => {
    if (newShow) {
      loading.value = true;
      error.value = null;
      entityStates.value = {};
      try {
        const response = await fetch("api/monitor-entities");
        if (!response.ok) {
          throw new Error("Failed to fetch entities");
        }
        const entityIds = await response.json();
        if (entityIds.length > 0) {
          entityIds.forEach((id: string) => {
            entityStates.value[id] = { state: "loading..." };
          });
          connectToHA(entityIds);
        }
      } catch (e: any) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
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
          Monitor
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white">
          <Icon icon="mdi:close" class="text-2xl" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div class="animate-fade-in">
          <div v-if="loading" class="text-center text-gray-400">
            <Icon icon="mdi:loading" class="animate-spin text-4xl mr-3" />
            Loading entities...
          </div>
          <div
            v-else-if="error"
            class="text-red-400 text-center p-4 bg-red-900/50 rounded-lg"
          >
            Error: {{ error }}
          </div>
          <div
            v-else-if="Object.keys(entityStates).length === 0"
            class="text-center text-gray-500"
          >
            No entities found to monitor.
          </div>
          <div
            v-else
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div
              v-for="(entity, entityId) in entityStates"
              :key="entityId"
              class="bg-gray-800 p-4 rounded-lg border-l-4"
              :class="
                entity.state === 'on' ? 'border-amber-400' : 'border-gray-600'
              "
            >
              <div class="flex justify-between items-center">
                <span class="font-mono text-sm text-gray-300">{{
                  entityId
                }}</span>
                <span
                  class="text-sm font-bold uppercase px-2 py-1 rounded"
                  :class="
                    entity.state === 'on'
                      ? 'bg-amber-400 text-black'
                      : 'bg-gray-700 text-gray-300'
                  "
                  >{{ entity.state }}</span
                >
              </div>
            </div>
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
