<script setup lang="ts">
import { ref, computed } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  show: Boolean,
  device: Object,
});

const emit = defineEmits(["close", "save", "edit"]);

// Controle das Abas
const activeTab = ref("base"); // 'base', 'io', 'subdevices'

// DADOS MOCK - Simulando o que viria do parse do YAML
const formData = ref({
  // Seção 1: Substitutions (Base Config)
  base: {
    device_name: "kinconya16_0101",
    fixed_mac: "0E:FF:31:16:B1:53",
    device_static_ip: "172.18.100.39",
    pi1swstate: "sw-01-01",
    area: "sotao", // Vem de esphome: area
  },

  // Seção 2: Packages (Input/Output Config)
  // Simulando portas que podem ser ativadas/desativadas
  io: [
    {
      id: "po1",
      enabled: false, // Simula o comentário #
      type: "light",
      vars: {
        po_name: "Luzes Cozinha",
        po_device: "Luzes_Cozinha",
        po_hub_id: "${hub_out_1}",
      },
    },
    {
      id: "po2",
      enabled: true, // Simula pacote ativo
      type: "switch",
      vars: {
        po_name: "Ventilador",
        po_device: "Ventilador_Sotao",
        po_hub_id: "${hub_out_2}",
      },
    },
  ],

  // Seção 3: Sub-Devices (Lista dinâmica)
  subdevices: [
    {
      id: "Luzes_Cozinha",
      name: "Luzes Cozinha",
      area_id: "cozinha",
    },
  ],
});

// Ações
const addSubDevice = () => {
  formData.value.subdevices.push({ id: "", name: "", area_id: "" });
};

const removeSubDevice = (index: number) => {
  formData.value.subdevices.splice(index, 1);
};

const save = () => {
  // Aqui futuramente montaremos o YAML de volta
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
      class="bg-[#2b2b2b] w-full max-w-4xl rounded-lg shadow-2xl border border-gray-700 flex flex-col max-h-[90vh]"
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
          <Icon icon="mdi:tune" class="mr-2 text-lg" />
          Base Config
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
          <Icon icon="mdi:import-export" class="mr-2 text-lg" />
          I/O Config (Packages)
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
          <Icon icon="mdi:devices" class="mr-2 text-lg" />
          Sub-Devices
          <div
            v-if="activeTab === 'subdevices'"
            class="absolute top-0 left-0 right-0 h-0.5 bg-esphome-accent"
          ></div>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div v-if="activeTab === 'base'" class="space-y-6 animate-fade-in">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="col-span-2">
              <label
                class="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                >Device Name (Substitution)</label
              >
              <input
                v-model="formData.base.device_name"
                type="text"
                class="w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white focus:ring-2 focus:ring-esphome-accent focus:border-transparent outline-none transition-all"
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
                class="w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white focus:ring-2 focus:ring-esphome-accent outline-none"
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
                class="w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white font-mono focus:ring-2 focus:ring-esphome-accent outline-none"
              />
            </div>

            <div>
              <label
                class="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                >Area (ESPHome)</label
              >
              <input
                v-model="formData.base.area"
                type="text"
                class="w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white focus:ring-2 focus:ring-esphome-accent outline-none"
              />
            </div>
            <div>
              <label
                class="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                >Initial State (pi1swstate)</label
              >
              <input
                v-model="formData.base.pi1swstate"
                type="text"
                class="w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white focus:ring-2 focus:ring-esphome-accent outline-none"
              />
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
                <label class="text-xs text-gray-400 block mb-1"
                  >Name (po_name)</label
                >
                <input
                  v-model="item.vars.po_name"
                  type="text"
                  class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-esphome-accent outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-gray-400 block mb-1"
                  >Device ID (po_device)</label
                >
                <input
                  v-model="item.vars.po_device"
                  type="text"
                  class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-esphome-accent outline-none"
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
            class="bg-gray-800 border border-gray-700 rounded p-4 relative group"
          >
            <button
              @click="removeSubDevice(index)"
              class="absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon icon="mdi:trash-can-outline" />
            </button>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="text-xs text-gray-400 block mb-1">ID</label>
                <input
                  v-model="sub.id"
                  placeholder="e.g. Luzes_Cozinha"
                  class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-esphome-accent outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-gray-400 block mb-1"
                  >Friendly Name</label
                >
                <input
                  v-model="sub.name"
                  placeholder="e.g. Luzes Cozinha"
                  class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-esphome-accent outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-gray-400 block mb-1">Area ID</label>
                <input
                  v-model="sub.area_id"
                  placeholder="e.g. cozinha"
                  class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:ring-1 focus:ring-esphome-accent outline-none"
                />
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
          Cancel
        </button>
        <button
          @click="save"
          class="px-5 py-2 bg-esphome-accent hover:brightness-110 text-white rounded shadow-lg shadow-esphome-accent/20 transition-all text-sm font-medium flex items-center"
        >
          <Icon icon="mdi:content-save-outline" class="mr-2" />
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Pequena animação de fade para a troca de abas */
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

/* Scrollbar fina para o modal */
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
