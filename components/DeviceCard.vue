<script setup lang="ts">
import { Icon } from "@iconify/vue";

// Definindo as propriedades que o cartão recebe
const props = defineProps({
    device: {
        type: Object,
        required: true,
        // Espera um objeto com { name, model, isOnline }
    },
});

// Funções placeholder para os botões
const handleAction = (action: string) => {
    console.log(
        `Ação acionada: ${action} para o dispositivo: ${props.device.name}`,
    );
    alert(
        `${action} não implementado ainda para ${props.device.name}.\n(Verifique o console do navegador)`,
    );
    // Futuramente, aqui chamaríamos outra rota da API do servidor
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
            <div>
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
                class="flex items-center space-x-1 text-xs font-bold uppercase tracking-wider"
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
                @click="handleAction('BACKUP')"
                class="text-gray-400 hover:text-esphome-accent flex items-center px-2 py-1 text-sm font-medium transition-colors"
            >
                <Icon icon="mdi:cloud-download-outline" class="mr-1" /> BACKUP
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
    </div>
</template>

<style scoped>
/* Ajustes finos para imitar os botões do ESPHome */
button {
    outline: none;
}
</style>
