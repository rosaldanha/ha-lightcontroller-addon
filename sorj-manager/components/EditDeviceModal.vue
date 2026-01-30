<script setup lang="ts">
import { ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import type { EsphomeConfig } from "~/utils/EsphomeConfig";

const props = defineProps<{
    show: boolean;
    device?: EsphomeConfig;
}>();

const emit = defineEmits(["close", "save"]);

const activeTab = ref("base_config");
const formData = ref<EsphomeConfig | undefined>();

watch(
    () => props.device,
    (newDevice) => {
        if (newDevice) {
            formData.value = JSON.parse(JSON.stringify(newDevice));
        } else {
            formData.value = undefined;
        }
    },
    { immediate: true },
);

const save = () => {
    if (formData.value) {
        emit("save", formData.value);
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
                    <Icon
                        icon="mdi:file-edit-outline"
                        class="mr-2 text-esphome-accent"
                    />
                    Edit Configuration: {{ device?.substitutions.device_name }}
                </h3>
                <button
                    @click="$emit('close')"
                    class="text-gray-400 hover:text-white"
                >
                    <Icon icon="mdi:close" class="text-2xl" />
                </button>
            </div>

            <div class="flex border-b border-gray-700 bg-[#363636]">
                <button
                    @click="activeTab = 'base_config'"
                    :class="[
                        'tab-button',
                        { 'active-tab': activeTab === 'base_config' },
                    ]"
                >
                    <Icon icon="mdi:tune" class="mr-2 text-lg" /> Base Config
                    <div
                        v-if="activeTab === 'base_config'"
                        class="active-tab-indicator"
                    ></div>
                </button>
                <button
                    @click="activeTab = 'sub_devices'"
                    :class="[
                        'tab-button',
                        { 'active-tab': activeTab === 'sub_devices' },
                    ]"
                >
                    <Icon icon="mdi:devices" class="mr-2 text-lg" /> Sub-Devices
                    <div
                        v-if="activeTab === 'sub_devices'"
                        class="active-tab-indicator"
                    ></div>
                </button>
                <button
                    @click="activeTab = 'inputs'"
                    :class="[
                        'tab-button',
                        { 'active-tab': activeTab === 'inputs' },
                    ]"
                >
                    <Icon icon="mdi:arrow-down-box" class="mr-2 text-lg" />
                    Inputs
                    <div
                        v-if="activeTab === 'inputs'"
                        class="active-tab-indicator"
                    ></div>
                </button>
                <button
                    @click="activeTab = 'outputs'"
                    :class="[
                        'tab-button',
                        { 'active-tab': activeTab === 'outputs' },
                    ]"
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
                    <!-- TODO: Implement Base Config fields -->
                </div>
                <div
                    v-else-if="activeTab === 'sub_devices'"
                    class="animate-fade-in"
                >
                    <!-- TODO: Implement Sub-Devices fields -->
                </div>
                <div v-else-if="activeTab === 'inputs'" class="animate-fade-in">
                    <!-- TODO: Implement Inputs fields -->
                </div>
                <div
                    v-else-if="activeTab === 'outputs'"
                    class="animate-fade-in"
                >
                    <!-- TODO: Implement Outputs fields -->
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
                    <Icon icon="mdi:content-save-outline" class="mr-2" /> Save
                    Changes
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
