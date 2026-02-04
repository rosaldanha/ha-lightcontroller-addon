<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Icon } from "@iconify/vue";
import {
  type EsphomeConfig,
  OutputPortLight,
  OutputPortSwitch,
} from "~/utils/EsphomeConfig";
import type { Port } from "~/utils/EsphomeConfig";
import { PackageKind } from "~/utils/Constants";

const props = defineProps<{
  show: boolean;
  device?: EsphomeConfig;
}>();

const emit = defineEmits(["close"]);

const activeTab = ref("base_config");
const formData = ref<EsphomeConfig | undefined>();
const validationErrors = ref<{ subdevices: { [key: number]: any } }>({
  subdevices: {},
});
const isSaving = ref(false);

const areas = ref<string[]>([]);

const { data: fetchedAreas, error } = await useFetch<string[]>("api/areas", {
  lazy: true,
  server: false,
});

watch(
  fetchedAreas,
  (newAreas) => {
    if (newAreas) {
      areas.value = newAreas;
    }
  },
  { immediate: true },
);

watch(
  () => props.device,
  (newDevice) => {
    if (newDevice) {
      const clonedDevice = JSON.parse(JSON.stringify(newDevice));
      // Reconstruct class instances for packages, as they are lost in JSON serialization
      if (clonedDevice.packages) {
        for (const key in clonedDevice.packages) {
          const pkgWrapper = clonedDevice.packages[key] as any;
          if (!pkgWrapper || !pkgWrapper.data || !pkgWrapper.data.vars)
            continue;

          const pkgData = pkgWrapper.data;

          if (pkgData._packageKind === PackageKind.LIGHT) {
            clonedDevice.packages[key] = {
              data: new OutputPortLight(
                pkgData.vars.po_id,
                pkgData.vars.po_name,
                pkgData.vars.po_device,
                pkgData.vars.po_hub_id,
                pkgData.vars.po_ph_id,
              ),
            };
          } else if (pkgData._packageKind === PackageKind.SWITCH) {
            clonedDevice.packages[key] = {
              data: new OutputPortSwitch(
                pkgData.vars.po_id,
                pkgData.vars.po_name,
                pkgData.vars.po_icon,
                pkgData.vars.po_device_class,
              ),
            };
          }
        }
      }
      formData.value = clonedDevice;
      validationErrors.value.subdevices = {}; // Reset errors on new device
    } else {
      formData.value = undefined;
    }
  },
  { immediate: true },
);

const subDeviceIds = computed(() => {
  if (!formData.value?.esphome?.devices) return [];
  return formData.value.esphome.devices.map((d) => d.id).filter(Boolean);
});

const outputPackages = computed(() => {
  if (!formData.value?.packages) return [];
  return Object.entries(formData.value.packages)
    .filter(
      ([key, value]) =>
        key.startsWith("po") &&
        value &&
        value.data &&
        (value.data._packageKind === PackageKind.LIGHT ||
          value.data._packageKind === PackageKind.SWITCH),
    )
    .map(([key, value]) => ({ key, value: value as { data: Port } }))
    .sort((a, b) => {
      const numA = parseInt(a.key.substring(2), 10);
      const numB = parseInt(b.key.substring(2), 10);
      return numA - numB;
    });
});

const isAddingOutput = ref(false);
const newOutputPort = ref("");
const newOutputType = ref<"light" | "switch" | "">("");

const availableOutputPorts = computed(() => {
  if (!formData.value?.packages) return [];
  const allPorts = Array.from({ length: 16 }, (_, i) => `po${i + 1}`);
  const usedPorts = Object.keys(formData.value.packages);
  return allPorts.filter((p) => !usedPorts.includes(p));
});

const beginAddOutput = () => {
  isAddingOutput.value = true;
};

const cancelAddOutput = () => {
  isAddingOutput.value = false;
  newOutputPort.value = "";
  newOutputType.value = "";
};

const confirmAddOutput = () => {
  if (
    !formData.value?.packages ||
    !newOutputPort.value ||
    !newOutputType.value
  ) {
    alert("Please select a port and a type.");
    return;
  }
  const key = newOutputPort.value;
  const type = newOutputType.value;

  let newPort;
  if (type === "light") {
    newPort = new OutputPortLight(key, `${key}_light`, "", "", 0);
  } else {
    newPort = new OutputPortSwitch(key, `${key}_switch`, "");
  }
  formData.value.packages[key] = { data: newPort };

  cancelAddOutput(); // Reset form
};

const removeOutput = (key: string) => {
  if (!formData.value?.packages) return;
  const portName = formData.value.packages[key]?.data?.vars?.po_name || key;
  if (
    window.confirm(`Are you sure you want to delete the output "${portName}"?`)
  ) {
    delete formData.value.packages[key];
  }
};

const onOutputTypeChange = (key: string, newType: "light" | "switch") => {
  if (!formData.value?.packages) return;
  const existingPackage = formData.value.packages[key];
  const oldName = existingPackage?.data?.vars?.po_name || `${key}_${newType}`;

  let newPort;
  if (newType === "light") {
    newPort = new OutputPortLight(key, oldName, "", "", 0);
  } else {
    newPort = new OutputPortSwitch(key, oldName, "");
  }
  formData.value.packages[key] = { data: newPort };
};

const validateSubDevices = () => {
  if (!formData.value?.esphome?.devices) return true;

  const errors: { [key: number]: any } = {};
  const ids = new Map();
  let isValid = true;

  for (const [index, device] of formData.value.esphome.devices.entries()) {
    // Check for empty fields
    if (!device.id) {
      if (!errors[index]) errors[index] = {};
      errors[index].id = "ID cannot be empty.";
      isValid = false;
    }
    if (!device.name) {
      if (!errors[index]) errors[index] = {};
      errors[index].name = "Name cannot be empty.";
      isValid = false;
    }
    if (!device.area_id) {
      if (!errors[index]) errors[index] = {};
      errors[index].area_id = "Area ID cannot be empty.";
      isValid = false;
    }

    // Check for duplicate IDs
    if (device.id) {
      if (ids.has(device.id)) {
        isValid = false;
        // Mark current and previous device with error
        if (!errors[index]) errors[index] = {};
        errors[index].id = `Duplicate ID: "${device.id}".`;
        const prevIndex = ids.get(device.id);
        if (!errors[prevIndex]) errors[prevIndex] = {};
        errors[prevIndex].id = `Duplicate ID: "${device.id}".`;
      } else {
        ids.set(device.id, index);
      }
    }
  }

  validationErrors.value.subdevices = errors;
  return isValid;
};

const save = async () => {
  if (!validateSubDevices()) {
    alert("Please fix the validation errors before saving.");
    return;
  }
  if (!formData.value) return;

  isSaving.value = true;
  try {
    await $fetch("api/devices", {
      method: "POST",
      body: formData.value,
    });
    emit("close");
  } catch (err: any) {
    console.error("Failed to save device:", err);
    alert(`Error: ${err.data?.message || err.message}`);
  } finally {
    isSaving.value = false;
  }
};

const addSubDevice = () => {
  if (!formData.value) return;
  if (!formData.value.esphome.devices) {
    formData.value.esphome.devices = [];
  }
  formData.value.esphome.devices.push({ id: "", name: "", area_id: "" });
};

const removeSubDevice = (index: number) => {
  if (!formData.value?.esphome?.devices) return;
  const deviceName = formData.value.esphome.devices[index]?.name || "untitled";
  if (
    window.confirm(
      `Are you sure you want to delete the sub-device "${deviceName}"? This action cannot be undone.`,
    )
  ) {
    formData.value.esphome.devices.splice(index, 1);
    validateSubDevices(); // Re-validate after removal
  }
};
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
          <Icon icon="mdi:file-edit-outline" class="mr-2 text-esphome-accent" />
          Edit Configuration: {{ device?.substitutions.device_name }}
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white">
          <Icon icon="mdi:close" class="text-2xl" />
        </button>
      </div>

      <div class="flex border-b border-gray-700 bg-[#363636]">
        <button
          @click="activeTab = 'base_config'"
          :class="['tab-button', { 'active-tab': activeTab === 'base_config' }]"
        >
          <Icon icon="mdi:tune" class="mr-2 text-lg" /> Base Config
          <div
            v-if="activeTab === 'base_config'"
            class="active-tab-indicator"
          ></div>
        </button>
        <button
          @click="activeTab = 'sub_devices'"
          :class="['tab-button', { 'active-tab': activeTab === 'sub_devices' }]"
        >
          <Icon icon="mdi:devices" class="mr-2 text-lg" /> Sub-Devices
          <div
            v-if="activeTab === 'sub_devices'"
            class="active-tab-indicator"
          ></div>
        </button>
        <button
          @click="activeTab = 'inputs'"
          :class="['tab-button', { 'active-tab': activeTab === 'inputs' }]"
        >
          <Icon icon="mdi:arrow-down-box" class="mr-2 text-lg" />
          Inputs
          <div v-if="activeTab === 'inputs'" class="active-tab-indicator"></div>
        </button>
        <button
          @click="activeTab = 'outputs'"
          :class="['tab-button', { 'active-tab': activeTab === 'outputs' }]"
        >
          <Icon icon="mdi:arrow-up-box" class="mr-2 text-lg" />
          Outputs
          <div
            v-if="activeTab === 'outputs'"
            class="active-tab-indicator"
          ></div>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div v-if="activeTab === 'base_config'" class="animate-fade-in">
          <div v-if="formData" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="col-span-2 md:col-span-1">
                <label
                  class="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                  >Device name</label
                >
                <input
                  v-model="formData.substitutions.device_name"
                  type="text"
                  class="input-field"
                />
              </div>
              <div class="col-span-2 md:col-span-1">
                <label
                  class="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                  >Area</label
                >
                <select v-model="formData.esphome.area" class="input-field">
                  <option disabled value="">Please select one</option>
                  <option v-for="area in areas" :key="area" :value="area">
                    {{ area }}
                  </option>
                </select>
              </div>
              <div>
                <label
                  class="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                  >Ip Address</label
                >
                <input
                  v-model="formData.substitutions.device_static_ip"
                  type="text"
                  class="input-field"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider"
                  >Mac address</label
                >
                <input
                  v-model="formData.substitutions.fixed_mac"
                  type="text"
                  class="input-field font-mono"
                />
              </div>
            </div>
          </div>
        </div>
        <div
          v-else-if="activeTab === 'sub_devices'"
          class="animate-fade-in space-y-4"
        >
          <div class="flex justify-between items-center mb-2">
            <p class="text-sm text-gray-400">
              Manage virtual sub-devices attached to this controller.
            </p>
            <button
              @click="addSubDevice"
              class="bg-esphome-accent hover:brightness-110 text-white px-4 py-2 rounded-md flex items-center text-sm font-semibold"
            >
              <Icon icon="mdi:plus" class="mr-1 text-base" /> New
            </button>
          </div>
          <div
            v-if="
              !formData?.esphome?.devices ||
              formData.esphome.devices.length === 0
            "
            class="text-center py-10 text-gray-500 italic border-2 border-dashed border-gray-700 rounded-lg"
          >
            No sub-devices configured.
          </div>
          <div
            v-for="(sub, index) in formData?.esphome?.devices"
            :key="index"
            class="bg-gray-800 border border-gray-700 rounded-lg p-4 relative group grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2"
          >
            <button
              @click="removeSubDevice(index)"
              class="absolute top-3 right-3 text-gray-500 hover:text-red-400 opacity-50 hover:opacity-100 transition-opacity"
            >
              <Icon icon="mdi:trash-can-outline" class="text-lg" />
            </button>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1"
                >ID</label
              >
              <input
                v-model="sub.id"
                class="input-field"
                :class="{
                  'border-red-500/50': validationErrors.subdevices[index]?.id,
                }"
              />
              <p
                v-if="validationErrors.subdevices[index]?.id"
                class="text-red-400 text-xs mt-1"
              >
                {{ validationErrors.subdevices[index].id }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1"
                >Friendly Name</label
              >
              <input
                v-model="sub.name"
                class="input-field"
                :class="{
                  'border-red-500/50': validationErrors.subdevices[index]?.name,
                }"
              />
              <p
                v-if="validationErrors.subdevices[index]?.name"
                class="text-red-400 text-xs mt-1"
              >
                {{ validationErrors.subdevices[index].name }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1"
                >Area ID</label
              >
              <select
                v-model="sub.area_id"
                class="input-field"
                :class="{
                  'border-red-500/50':
                    validationErrors.subdevices[index]?.area_id,
                }"
              >
                <option disabled value="">Please select one</option>
                <option v-for="area in areas" :key="area" :value="area">
                  {{ area }}
                </option>
              </select>
              <p
                v-if="validationErrors.subdevices[index]?.area_id"
                class="text-red-400 text-xs mt-1"
              >
                {{ validationErrors.subdevices[index].area_id }}
              </p>
            </div>
          </div>
        </div>
        <div
          v-else-if="activeTab === 'inputs' && formData"
          class="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div
            v-for="i in 16"
            :key="i"
            class="bg-gray-800 border border-gray-700 rounded-lg p-4"
          >
            <h4 class="font-bold text-lg mb-3 text-gray-300">
              Input pi{{ i }}
            </h4>
            <div class="space-y-4">
              <div>
                <label
                  :for="`pi${i}device`"
                  class="block text-xs font-medium text-gray-400 mb-1"
                  >Sub-Device:</label
                >
                <select
                  v-model="formData.substitutions[`pi${i}device`]"
                  :id="`pi${i}device`"
                  class="input-field"
                >
                  <option :value="undefined">None</option>
                  <option
                    v-for="subId in subDeviceIds"
                    :key="subId"
                    :value="subId"
                  >
                    {{ subId }}
                  </option>
                </select>
              </div>
              <div>
                <label
                  :for="`pi${i}swstate`"
                  class="block text-xs font-medium text-gray-400 mb-1"
                  >Switch Label:</label
                >
                <input
                  v-model="formData.substitutions[`pi${i}swstate`]"
                  :id="`pi${i}swstate`"
                  type="text"
                  class="input-field"
                />
              </div>
            </div>
          </div>
        </div>
        <div
          v-else-if="activeTab === 'outputs' && formData"
          class="animate-fade-in space-y-4"
        >
          <div class="flex justify-between items-center mb-4">
            <p class="text-sm text-gray-400">
              Manage physical output ports (relays).
            </p>
            <button
              @click="beginAddOutput"
              :disabled="isAddingOutput"
              class="bg-esphome-accent hover:brightness-110 text-white px-4 py-2 rounded-md flex items-center text-sm font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              <Icon icon="mdi:plus" class="mr-1 text-base" /> New
            </button>
          </div>

          <!-- New Output Form -->
          <div
            v-if="isAddingOutput"
            class="bg-gray-900/50 border border-esphome-accent/30 rounded-lg p-4 mb-4 space-y-3 animate-fade-in"
          >
            <h4 class="font-semibold text-white">Add New Output</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1"
                  >Select Port</label
                >
                <select v-model="newOutputPort" class="input-field">
                  <option disabled value="">Choose a port...</option>
                  <option
                    v-for="port in availableOutputPorts"
                    :key="port"
                    :value="port"
                  >
                    {{ port }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1"
                  >Select Type</label
                >
                <select v-model="newOutputType" class="input-field">
                  <option disabled value="">Choose a type...</option>
                  <option value="light">Light</option>
                  <option value="switch">Switch</option>
                </select>
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button
                @click="cancelAddOutput"
                class="px-4 py-2 text-gray-300 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                @click="confirmAddOutput"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
              >
                Confirm & Add
              </button>
            </div>
          </div>

          <div
            v-if="!outputPackages || outputPackages.length === 0"
            class="text-center py-10 text-gray-500 italic border-2 border-dashed border-gray-700 rounded-lg"
          >
            No outputs configured.
          </div>

          <div
            v-for="pkg in outputPackages"
            :key="pkg.key"
            class="bg-gray-800 border border-gray-700 rounded-lg p-4 relative group"
          >
            <div
              class="flex justify-between items-center border-b border-gray-700 pb-3 mb-3"
            >
              <h4 class="font-bold text-lg text-gray-300 uppercase">
                Output {{ pkg.key }}
              </h4>
              <div class="flex items-center gap-4">
                <select
                  :value="pkg.value.data._packageKind"
                  @change="
                    onOutputTypeChange(
                      pkg.key,
                      ($event.target as HTMLSelectElement)?.value as any,
                    )
                  "
                  class="input-field bg-gray-700 text-sm"
                  style="width: 120px"
                >
                  <option value="light">Light</option>
                  <option value="switch">Switch</option>
                </select>
                <button
                  @click="removeOutput(pkg.key)"
                  class="text-gray-500 hover:text-red-400 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <Icon icon="mdi:trash-can-outline" class="text-lg" />
                </button>
              </div>
            </div>

            <!-- Light Port Form -->
            <div
              v-if="pkg.value.data._packageKind === PackageKind.LIGHT"
              class="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1"
                  >Name</label
                >
                <input
                  v-model="pkg.value.data.vars.po_name"
                  type="text"
                  class="input-field"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1"
                  >Sub-Device</label
                >
                <select
                  v-model="pkg.value.data.vars.po_device"
                  class="input-field"
                >
                  <option value="">None</option>
                  <option
                    v-for="subId in subDeviceIds"
                    :key="subId"
                    :value="subId"
                  >
                    {{ subId }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1"
                  >Hub ID</label
                >
                <input
                  v-model="pkg.value.data.vars.po_hub_id"
                  type="text"
                  class="input-field"
                  placeholder="e.g. ${hub_out_1}"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1"
                  >Placeholder ID</label
                >
                <input
                  v-model.number="pkg.value.data.vars.po_ph_id"
                  type="number"
                  class="input-field"
                />
              </div>
            </div>

            <!-- Switch Port Form -->
            <div
              v-else-if="pkg.value.data._packageKind === PackageKind.SWITCH"
              class="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-400 mb-1"
                  >Name</label
                >
                <input
                  v-model="pkg.value.data.vars.po_name"
                  type="text"
                  class="input-field"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-400 mb-1"
                  >Icon</label
                >
                <input
                  v-model="pkg.value.data.vars.po_icon"
                  type="text"
                  class="input-field"
                  placeholder="e.g. mdi:fan"
                />
              </div>
              <div class="md:col-span-3">
                <label class="block text-xs font-medium text-gray-400 mb-1"
                  >Device Class</label
                >
                <input
                  v-model="pkg.value.data.vars.po_device_class"
                  type="text"
                  class="input-field"
                  placeholder="e.g. switch"
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
          :disabled="isSaving"
          class="px-5 py-2 bg-esphome-accent hover:brightness-110 text-white rounded shadow-lg shadow-esphome-accent/20 transition-all text-sm font-medium flex items-center disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          <Icon v-if="isSaving" icon="mdi:loading" class="animate-spin mr-2" />
          <Icon v-else icon="mdi:content-save-outline" class="mr-2" />
          {{ isSaving ? "Saving..." : "Save Changes" }}
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
.tab-button {
  @apply flex-1 py-3 px-4 text-sm font-medium transition-colors relative flex justify-center items-center text-gray-400 hover:text-gray-200 hover:bg-[#404040];
}
.active-tab {
  @apply text-white bg-[#2b2b2b];
}
.active-tab-indicator {
  @apply absolute top-0 left-0 right-0 h-0.5 bg-esphome-accent;
}
.input-field {
  @apply w-full bg-gray-800 border border-gray-600 rounded p-2.5 text-white focus:ring-2 focus:ring-esphome-accent focus:border-transparent outline-none transition-all text-sm;
}
</style>
