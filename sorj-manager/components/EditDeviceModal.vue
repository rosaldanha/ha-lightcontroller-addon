<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  show: Boolean,
  device: Object,
});

const emit = defineEmits(["close", "save"]);

const activeTab = ref("base");

// Função auxiliar para gerar dados mock das 16 portas
const createMockBaseData = () => {
  const baseData: any = {
    device_name: "kinconya16_0101",
    fixed_mac: "0E:FF:31:16:B1:53",
    device_static_ip: "172.18.100.39",
    area: "sotao",
  };

  // Inicializa os campos de 1 a 16 vazios ou com valores de exemplo
  for (let i = 1; i <= 16; i++) {
    baseData[`pi${i}device`] = "";
    baseData[`po${i}device`] = "";
    baseData[`pi${i}swstate`] = "";
  }

  // Valores de exemplo para ver na tela
  baseData["pi1swstate"] = "sw-01-01";
  baseData["po1device"] = "Luzes_Cozinha";
  baseData["pi2device"] = "Sensor_Presenca";

  return baseData;
};

const formData = ref({
  base: createMockBaseData(),

  io: [
    {
      id: "po1",
      enabled: false,
      type: "light",
      vars: {
        po_name: "Luzes Cozinha",
        po_device: "Luzes_Cozinha",
        po_hub_id: "${hub_out_1}",
      },
    },
    {
      id: "po2",
      enabled: true,
      type: "switch",
      vars: {
        po_name: "Ventilador",
        po_device: "Ventilador_Sotao",
        po_hub_id: "${hub_out_2}",
      },
    },
  ],

  subdevices: [
    {
      id: "Luzes_Cozinha",
      name: "Luzes Cozinha",
      area_id: "cozinha",
    },
  ],
});

const addSubDevice = () => {
  formData.value.subdevices.push({ id: "", name: "", area_id: "" });
};

const removeSubDevice = (index: number) => {
  formData.value.subdevices.splice(index, 1);
};

const save = () => {
  console.log("Saving data:", formData.value);
  emit("save", formData.value);
};
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
  >
    <div
      class="bg-[#2b2b2b] w-full max-w-5xl rounded-lg shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]"
    >
      <div
        class="flex justify-between items-center p-6 border-b border-gray-700"
      >
        <h3 class="text-xl font-semibold text-white flex items-center">
          <Icon icon="mdi:file-edit-outline" class="mr-2 text-esphome-accent" />
          Edit Configuration: {{ device?.name }}
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white">
          <Icon icon="mdi:close" class="text-2xl" />
        </button>
      </div>

      <div class="flex border-b border-gray-700 bg-[#363636]">
        <button
          @click="activeTab = 'base'"
          class="flex-1 py-3 px-4 text-sm font-medium transition-colors relative flex justify-center items-center"
          :class="
            activeTab === 'base'
              ? 'text-white bg-[#2b2b2b]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#404040]'
          "
        >
          <Icon icon="mdi:tune" class="mr-2 text-lg" /> Base Config
          <div
            v-if="activeTab === 'base'"
            class="absolute top-0 left-0 right-0 h-0.5 bg-esphome-accent"
          ></div>
        </button>
        <button
          @click="activeTab = 'io'"
          class="flex-1 py-3 px-4 text-sm font-medium transition-colors relative flex justify-center items-center"
          :class="
            activeTab === 'io'
              ? 'text-white bg-[#2b2b2b]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#404040]'
          "
        >
          <Icon icon="mdi:import-export" class="mr-2 text-lg" /> I/O Config
          <div
            v-if="activeTab === 'io'"
            class="absolute top-0 left-0 right-0 h-0.5 bg-esphome-accent"
          ></div>
        </button>
        <button
          @click="activeTab = 'subdevices'"
          class="flex-1 py-3 px-4 text-sm font-medium transition-colors relative flex justify-center items-center"
          :class="
            activeTab === 'subdevices'
              ? 'text-white bg-[#2b2b2b]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#404040]'
          "
        >
          <Icon icon="mdi:devices" class="mr-2 text-lg" /> Sub-Devices
          <div
            v-if="activeTab === 'subdevices'"
            class="absolute top-0 left-0 right-0 h-0.5 bg-esphome-accent"
          ></div>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div v-if="activeTab === 'base'" class="space-y-6 animate-fade-in">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="col-span-2 md:col-span-1">
              <label
                class="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                >Device Name</label
              >
              <input
                v-model="formData.base.device_name"
                type="text"
                class="input-field"
              />
            </div>
            <div class="col-span-2 md:col-span-1">
              <label
                class="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                >Area</label
              >
              <input
                v-model="formData.base.area"
                type="text"
                class="input-field"
              />
            </div>
            <div>
              <label
                class="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                >Static IP</label
              >
              <input
                v-model="formData.base.device_static_ip"
                type="text"
                class="input-field"
              />
            </div>
            <div>
              <label
                class="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                >Fixed MAC</label
              >
              <input
                v-model="formData.base.fixed_mac"
                type="text"
                class="input-field font-mono"
              />
            </div>
          </div>

          <hr class="border-gray-700" />

          <div class="bg-gray-800/40 border border-gray-700 rounded-lg p-5">
            <div class="flex items-center mb-4">
              <Icon
                icon="mdi:ethernet"
                class="text-esphome-accent text-xl mr-2"
              />
              <h4 class="text-white font-medium">Port Configuration (1-16)</h4>
            </div>

            <div
              class="grid grid-cols-12 gap-4 mb-2 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider"
            >
              <div class="col-span-1 text-center">X</div>
              <div class="col-span-4">
                pi<span class="text-gray-600">X</span>device
              </div>
              <div class="col-span-4">
                pi<span class="text-gray-600">X</span>swstate
              </div>
              <div class="col-span-3">
                po<span class="text-gray-600">X</span>device
              </div>
            </div>

            <div class="space-y-2">
              <div
                v-for="i in 16"
                :key="i"
                class="grid grid-cols-12 gap-4 items-center bg-gray-900/50 p-2 rounded hover:bg-gray-800 transition-colors"
              >
                <div
                  class="col-span-1 text-center text-gray-400 font-mono font-bold"
                >
                  {{ i }}
                </div>

                <div class="col-span-4">
                  <input
                    v-model="formData.base[`pi${i}device`]"
                    placeholder="-"
                    class="w-full bg-transparent border-b border-gray-700 focus:border-esphome-accent text-sm text-white px-2 py-1 outline-none transition-colors placeholder-gray-700"
                  />
                </div>

                <div class="col-span-4">
                  <input
                    v-model="formData.base[`pi${i}swstate`]"
                    placeholder="-"
                    class="w-full bg-transparent border-b border-gray-700 focus:border-esphome-accent text-sm text-white px-2 py-1 outline-none transition-colors placeholder-gray-700"
                  />
                </div>

                <div class="col-span-3">
                  <input
                    v-model="formData.base[`po${i}device`]"
                    placeholder="-"
                    class="w-full bg-transparent border-b border-gray-700 focus:border-esphome-accent text-sm text-white px-2 py-1 outline-none transition-colors placeholder-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'io'" class="space-y-4 animate-fade-in">
          <p class="text-sm text-gray-400 mb-4">
            Enable packages to configure Input/Output mappings.
          </p>
          <div
            v-for="(item, idx) in formData.io"
            :key="item.id"
            class="bg-gray-800/50 border border-gray-700 rounded-lg p-4 transition-all"
            :class="{
              'border-l-4 border-l-esphome-accent bg-gray-800': item.enabled,
            }"
          >
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div
                  class="h-8 w-8 rounded-full flex items-center justify-center bg-gray-700 font-bold text-gray-400"
                >
                  {{ idx + 1 }}
                </div>
                <div>
                  <h4 class="font-medium text-white">
                    Port {{ item.id.toUpperCase() }}
                  </h4>
                  <p class="text-xs text-gray-500">{{ item.type }} package</p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="item.enabled"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"
                ></div>
                <span class="ml-2 text-sm font-medium text-gray-300">{{
                  item.enabled ? "Enabled" : "Disabled"
                }}</span>
              </label>
            </div>
            <div
              v-if="item.enabled"
              class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700/50"
            >
              <div>
                <label class="text-xs text-gray-400 block mb-1">Name</label>
                <input
                  v-model="item.vars.po_name"
                  type="text"
                  class="input-field"
                />
              </div>
              <div>
                <label class="text-xs text-gray-400 block mb-1"
                  >Device ID</label
                >
                <input
                  v-model="item.vars.po_device"
                  type="text"
                  class="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="activeTab === 'subdevices'"
          class="space-y-4 animate-fade-in"
        >
          <div class="flex justify-between items-center mb-2">
            <p class="text-sm text-gray-400">
              Manage virtual sub-devices attached to this controller.
            </p>
            <button
              @click="addSubDevice"
              class="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded flex items-center"
            >
              <Icon icon="mdi:plus" class="mr-1" /> Add Device
            </button>
          </div>
          <div
            v-if="formData.subdevices.length === 0"
            class="text-center py-8 text-gray-500 italic border border-dashed border-gray-700 rounded"
          >
            No sub-devices configured.
          </div>
          <div
            v-for="(sub, index) in formData.subdevices"
            :key="index"
            class="bg-gray-800 border border-gray-700 rounded p-4 relative group grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <button
              @click="removeSubDevice(index)"
              class="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon icon="mdi:trash-can-outline" />
            </button>
            <div>
              <label class="text-xs text-gray-400 block mb-1">ID</label
              ><input v-model="sub.id" class="input-field" />
            </div>
            <div>
              <label class="text-xs text-gray-400 block mb-1"
                >Friendly Name</label
              ><input v-model="sub.name" class="input-field" />
            </div>
            <div>
              <label class="text-xs text-gray-400 block mb-1">Area ID</label
              ><input v-model="sub.area_id" class="input-field" />
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
          Cancel
        </button>
        <button
          @click="save"
          class="px-5 py-2 bg-esphome-accent hover:brightness-110 text-white rounded shadow-lg shadow-esphome-accent/20 transition-all text-sm font-medium flex items-center"
        >
          <Icon icon="mdi:content-save-outline" class="mr-2" /> Save Changes
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

/* Classe utilitária para inputs padrão */
.input-field {
  @apply w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white focus:ring-2 focus:ring-esphome-accent focus:border-transparent outline-none transition-all text-sm;
}
</style>
