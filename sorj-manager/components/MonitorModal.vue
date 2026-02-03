<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import { $fetch } from "ofetch";
import type { EsphomeConfig } from "~/utils/EsphomeConfig";

const props = defineProps<{
  show: boolean;
  devices: EsphomeConfig[] | null;
}>();

defineEmits(["close"]);

// Holds info for the cards to be displayed
interface ChangedPortInfo {
  config: EsphomeConfig;
  port: number;
  key: string;
  entityName: string; // e.g., kinconya16_0101_pi16
  action: string;
}
const changedPorts = ref<ChangedPortInfo[]>([]);

const socket = ref<WebSocket | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const status = ref<string>("");
let messageId = 1;

const subDeviceIds = (config: EsphomeConfig) => {
  if (!config?.esphome?.devices) return [];
  return config.esphome.devices.map((d) => d.id).filter(Boolean);
};

const saveAction = (portInfo: ChangedPortInfo) => {
  const dataToShow = {
    deviceName: portInfo.config.substitutions.device_name,
    port: portInfo.port,
    entityName: portInfo.entityName,
    piDevice: portInfo.config.substitutions[`pi${portInfo.port}device`],
    piSwState: portInfo.config.substitutions[`pi${portInfo.port}swstate`],
    action: portInfo.action,
  };
  alert(JSON.stringify(dataToShow, null, 2));
};

const connectToHA = async () => {
  loading.value = true;
  error.value = null;
  changedPorts.value = [];
  status.value = "Connecting...";

  try {
    const response = await $fetch<string[]>("api/monitored_entities");
    if (!response) {
      throw new Error("Failed to fetch entities to monitor.");
    }
    const WATCH_LIST = response;

    if (!WATCH_LIST || WATCH_LIST.length === 0) {
      status.value = "No entities found to monitor.";
      loading.value = false;
      return;
    }
    status.value = `Monitoring ${WATCH_LIST.length} entities...`;

    const runtimeConfig = useRuntimeConfig();
    const token = runtimeConfig.public.supervisorToken;
    const wssUrl = runtimeConfig.public.wssUrl;

    if (!token) {
      throw new Error("Supervisor token is not available.");
    }

    socket.value = new WebSocket(wssUrl);

    socket.value.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "auth_required") {
        socket.value?.send(
          JSON.stringify({ type: "auth", access_token: token }),
        );
      } else if (msg.type === "auth_ok") {
        status.value = "Authentication successful. Subscribing to events...";
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
        if (WATCH_LIST.includes(entityId)) {
          handleStateChange(entityId);
        }
      }
    };

    socket.value.onopen = () => {
      status.value = "Connection opened, authenticating...";
    };
    socket.value.onerror = (err) => {
      console.error("WebSocket Error:", err);
      error.value = "Failed to connect to Home Assistant WebSocket.";
    };
    socket.value.onclose = () => {
      status.value = "WebSocket connection closed.";
    };
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const handleStateChange = (entityId: string) => {
  if (!props.devices) return;

  const entityName = entityId.split(".")[1];
  if (!entityName || !entityName.includes("_pi")) return;

  const lastUnderscoreIndex = entityName.lastIndexOf("_");
  const deviceName = entityName.substring(0, lastUnderscoreIndex);
  const portId = entityName.substring(lastUnderscoreIndex + 1);
  const portNumber = parseInt(portId.replace("pi", ""), 10);

  if (isNaN(portNumber)) return;

  const foundConfig = props.devices.find(
    (config) =>
      config.substitutions.device_name === deviceName ||
      config.esphome.devices?.some((d) => d.name === deviceName),
  );

  if (foundConfig) {
    const key = `${foundConfig.substitutions.device_name}-${portNumber}`;
    if (!changedPorts.value.some((p) => p.key === key)) {
      changedPorts.value.unshift({
        config: foundConfig,
        port: portNumber,
        key: key,
        entityName: entityName,
        action: "",
      });
    }
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
          Input Monitor
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white">
          <Icon icon="mdi:close" class="text-2xl" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div v-if="loading" class="text-center text-gray-400">Loading...</div>
        <div v-else-if="error" class="text-center text-red-400">
          {{ error }}
        </div>
        <div
          v-else-if="changedPorts.length === 0"
          class="text-center text-gray-400 italic mt-10"
        >
          {{ status }}<br />
          Waiting for input state changes...
        </div>
        <div
          v-else
          class="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="item in changedPorts"
            :key="item.key"
            class="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in"
          >
            <h4 class="font-bold text-lg text-gray-300">
              Input pi{{ item.port }}
              <span class="text-sm font-light text-gray-400 ml-1"
                >on {{ item.config.substitutions.device_name }}</span
              >
            </h4>

            <div class="space-y-4">
              <div>
                <label
                  :for="`${item.key}-device`"
                  class="block text-xs font-medium text-gray-400 mb-1"
                  >Sub-Device:</label
                >
                <select
                  v-model="item.config.substitutions[`pi${item.port}device`]"
                  :id="`${item.key}-device`"
                  class="input-field"
                >
                  <option :value="undefined">None</option>
                  <option
                    v-for="subId in subDeviceIds(item.config)"
                    :key="subId"
                    :value="subId"
                  >
                    {{ subId }}
                  </option>
                </select>
              </div>
              <div>
                <label
                  :for="`${item.key}-swstate`"
                  class="block text-xs font-medium text-gray-400 mb-1"
                  >Switch Label:</label
                >
                <input
                  v-model="item.config.substitutions[`pi${item.port}swstate`]"
                  :id="`${item.key}-swstate`"
                  type="text"
                  class="input-field"
                />
              </div>
              <div>
                <label
                  :for="`${item.entityName}action`"
                  class="block text-xs font-medium text-gray-400 mb-1"
                  >Action:</label
                >
                <input
                  v-model="item.action"
                  :id="`${item.entityName}action`"
                  type="text"
                  class="input-field"
                />
              </div>
            </div>

            <div class="mt-auto flex justify-end">
              <button
                @click="saveAction(item)"
                class="px-4 py-2 bg-esphome-accent hover:brightness-110 text-white rounded shadow-lg shadow-esphome-accent/20 transition-all text-sm font-medium flex items-center"
              >
                <Icon icon="mdi:content-save-outline" class="mr-2" /> Save
              </button>
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
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
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
.input-field {
  @apply w-full bg-gray-900/50 border border-gray-600 rounded p-2.5 text-white focus:ring-2 focus:ring-esphome-accent focus:border-transparent outline-none transition-all text-sm;
}
</style>
