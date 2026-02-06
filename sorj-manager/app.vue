<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";
import EditDeviceModal from "./components/EditDeviceModal.vue";
import MonitorModal from "./components/MonitorModal.vue";
import { EsphomeConfig } from "./utils/EsphomeConfig";

const showEditModal = ref(false);
const showMonitorModal = ref(false);
const deviceToEdit = ref<EsphomeConfig | null>(null);

// A API agora retorna um array de objetos EsphomeConfig
const {
  data: devices,
  pending,
  error,
  refresh,
} = await useFetch<EsphomeConfig[]>("api/devices");

const openEditModal = (device: EsphomeConfig) => {
  console.log("Abrindo edição para:", device.substitutions.device_name);
  deviceToEdit.value = device;
  showEditModal.value = true;
};

const openNewDeviceModal = () => {
  const newDevice = new EsphomeConfig(
    "new-device",
    "00:00:00:00:00:00",
    "172.18.0.0",
    "",
  );
  openEditModal(newDevice);
};
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans">
    <header
      class="bg-esphome-header text-white p-4 shadow-md flex items-center justify-between sticky top-0 z-10"
    >
      <div class="flex items-center space-x-3">
        <Icon icon="mdi:chip" class="text-3xl text-esphome-accent" />
        <h1 class="text-lg font-semibold tracking-wide">LightControllers</h1>
      </div>
      <div
        class="flex items-center space-x-4 text-sm font-medium text-gray-300"
      >
        <!-- <button
          @click="refresh()"
          class="hover:text-white flex items-center transition-colors"
        >
          <Icon
            icon="mdi:refresh"
            class="mr-1 text-lg"
            :class="{ 'animate-spin': pending }"
          />
          REFRESH ALL
        </button> -->
        <button
          @click="showMonitorModal = true"
          class="hover:text-white transition-colors hidden md:block"
        >
          Monitor
        </button>
        <Icon
          icon="mdi:magnify"
          class="text-lg hover:text-white cursor-pointer"
        />
      </div>
    </header>

    <main class="flex-grow p-4 sm:p-6">
      <div
        v-if="pending"
        class="flex justify-center items-center h-64 text-gray-400"
      >
        <Icon icon="mdi:loading" class="animate-spin text-4xl mr-3" />
        Loading devices...
      </div>

      <div
        v-else-if="error"
        class="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg"
      >
        Failed to load devices: {{ error.message }}
      </div>

      <div
        v-else-if="!devices || devices.length === 0"
        class="text-center text-gray-400 mt-10"
      >
        Nenhum controlador "sorj-net.lightcontroller" encontrado.
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <DeviceCard
          v-for="device in devices"
          :key="device.substitutions.device_name"
          :device="device"
          @edit="openEditModal"
        />
      </div>
    </main>

    <div class="fixed bottom-6 right-6">
      <button
        @click="openNewDeviceModal"
        class="bg-esphome-success hover:bg-green-600 text-white font-medium py-2 px-4 rounded-full shadow-lg flex items-center transition-colors"
      >
        <Icon icon="mdi:plus" class="text-xl mr-1" /> NEW DEVICE
      </button>
    </div>
  </div>
  <EditDeviceModal
    :show="showEditModal"
    :device="deviceToEdit"
    @close="showEditModal = false"
  />
  <MonitorModal
    :show="showMonitorModal"
    :devices="devices"
    @close="showMonitorModal = false"
  />
</template>

<style>
/* Estilos globais */
body {
  @apply bg-esphome-bg;
}
</style>
