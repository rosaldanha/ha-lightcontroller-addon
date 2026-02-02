<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { Icon } from "@iconify/vue";
import { useEventSource } from "@vueuse/core";
const props = defineProps<{
  show: boolean;
}>();

defineEmits(["close"]);

const eventLog = ref<string[]>([]);
const eventSource = ref<useEventSource | null>(null);

const connectToStream = () => {
  eventLog.value = []; // Clear log on new connection
  eventSource.value = new useEventSource("api/stream");

  eventSource.value.onmessage = (event) => {
    alert(event);
    // console.warn(event);
    // eventLog.value.push(event);
    // try {
    //   const data = JSON.parse(event.data);
    //   let logEntry = `[${new Date().toLocaleTimeString()}] `;

    //   if (data.data && data.data === "Connected") {
    //     logEntry += "Stream connected successfully.";
    //   } else if (data.entity_id && data.state) {
    //     logEntry += `Entity: ${data.entity_id}, New State: ${data.state.state}`;
    //   } else {
    //     logEntry += `Received unhandled message: ${event.data}`;
    //   }
    //   eventLog.value.push(logEntry);
    // } catch (e) {
    //   console.error("Error parsing SSE data:", e);
    //   eventLog.value.push(
    //     `[${new Date().toLocaleTimeString()}] Received invalid data: ${event.data}`,
    //   );
    // }
  };

  eventSource.value.onerror = (err) => {
    console.error("EventSource failed:", err);
    eventLog.value.push(
      `[${new Date().toLocaleTimeString()}] Error connecting to stream.`,
    );
    eventSource.value?.close();
  };
};

const disconnectFromStream = () => {
  if (eventSource.value) {
    eventSource.value.close();
    eventSource.value = null;
  }
};

watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      connectToStream();
    } else {
      disconnectFromStream();
    }
  },
);

onUnmounted(() => {
  disconnectFromStream();
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
