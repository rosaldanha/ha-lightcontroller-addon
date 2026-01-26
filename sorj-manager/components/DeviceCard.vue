<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ref } from "vue";

const props = defineProps({
    device: {
        type: Object,
        required: true,
    },
});

// Estado para controlar o loading de cada ação
const isLoading = ref({
    backup: false,
    restore: false,
    update: false,
});
const showRestoreModal = ref(false);

const handleBackup = async () => {
    if (isLoading.value.backup) return;
    isLoading.value.backup = true;

    try {
        // 1. Chama a API
        const data: any = await $fetch("/api/backup", {
            method: "POST",
            body: { deviceName: props.device.name }, // Envia o nome do dispositivo
        });

        if (!data || data.trim().length === 0) {
            alert(
                "Nenhuma configuração encontrada para fazer backup (entidades não encontradas).",
            );
            return;
        }

        // 2. Cria o arquivo para download no navegador
        const blob = new Blob([data], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        // Nome do arquivo: backup-nomedodispositivo-data.txt
        const dateStr = new Date().toISOString().slice(0, 10);
        link.setAttribute(
            "download",
            `backup-${props.device.name}-${dateStr}.txt`,
        );

        document.body.appendChild(link);
        link.click();

        // Limpeza
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error(err);
        alert("Falha ao realizar backup. Verifique o console.");
    } finally {
        isLoading.value.backup = false;
    }
};

const handleAction = (action: string) => {
    if (action === "BACKUP") {
        handleBackup();
    } else if (action === "RESTORE") {
        // Abre o modal
        showRestoreModal.value = true;
    } else {
        alert(`Ação ${action} em desenvolvimento.`);
    }
};
</script>

<template>
    <div
        class="bg-esphome-card rounded shadow-md overflow-hidden flex flex-col border-t-4 transition-all hover:shadow-lg"
        :class="[
            device.isOnline ? 'border-esphome-success' : 'border-esphome-error',
        ]"
    >
        <div class="p-4 flex justify-between items-start mb-auto">
            <div class="overflow-hidden">
                <h3
                    class="text-lg font-medium text-gray-100 truncate"
                    :title="device.name"
                >
                    {{ device.name }}
                </h3>
                <p class="text-sm text-gray-400 truncate" :title="device.model">
                    {{ device.model }}
                </p>
            </div>

            <div
                class="flex items-center space-x-1 text-xs font-bold uppercase tracking-wider flex-shrink-0 ml-2"
            >
                <span v-if="device.isOnline" class="text-esphome-success"
                    >Online</span
                >
                <span v-else class="text-esphome-error">Offline</span>
            </div>
        </div>

        <div
            class="bg-[#222222] px-2 py-2 flex items-center justify-end space-x-2"
        >
            <button
                @click="handleAction('UPDATE')"
                class="text-gray-400 hover:text-esphome-accent flex items-center px-2 py-1 text-sm font-medium transition-colors"
            >
                <Icon icon="mdi:arrow-up-bold-circle-outline" class="mr-1" />
                UPDATE
            </button>

            <button
                @click="handleAction('EDIT')"
                class="text-gray-400 hover:text-esphome-accent flex items-center px-2 py-1 text-sm font-medium transition-colors"
            >
                <Icon icon="mdi:pencil" class="mr-1" /> EDIT
            </button>

            <button
                @click="handleBackup()"
                :disabled="isLoading.backup"
                class="text-gray-400 hover:text-esphome-accent flex items-center px-2 py-1 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                <Icon
                    v-if="isLoading.backup"
                    icon="mdi:loading"
                    class="mr-1 animate-spin"
                />
                <Icon v-else icon="mdi:cloud-download-outline" class="mr-1" />
                BACKUP
            </button>

            <button
                @click="handleAction('RESTORE')"
                class="text-gray-400 hover:text-esphome-accent flex items-center px-2 py-1 text-sm font-medium transition-colors"
            >
                <Icon icon="mdi:cloud-upload-outline" class="mr-1" /> RESTORE
            </button>

            <div class="flex-grow"></div>

            <button class="text-gray-400 hover:text-gray-200">
                <Icon icon="mdi:dots-vertical" />
            </button>
        </div>
        <RestoreModal
            :show="showRestoreModal"
            :device="device"
            @close="showRestoreModal = false"
        />
    </div>
</template>

<style scoped>
button {
    outline: none;
}
</style>
