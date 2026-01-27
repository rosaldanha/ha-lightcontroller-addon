<script setup lang="ts">
import { ref } from "vue";
import { Icon } from "@iconify/vue";

const props = defineProps({
  show: Boolean,
  device: Object,
});

const emit = defineEmits(["close", "completed"]);

const fileInput = ref<HTMLInputElement | null>(null);
const isProcessing = ref(false);
const progress = ref(0);
const currentEntity = ref("");
const logs = ref<string[]>([]);
const hasError = ref(false);

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  isProcessing.value = true;
  logs.value = [];
  hasError.value = false;
  progress.value = 0;
  currentEntity.value = "Uploading & Restoring YAML...";

  try {
    // 1. PREPARA O UPLOAD DO ZIP
    const formData = new FormData();
    formData.append("file", file);

    logs.value.push("Uploading ZIP file...");

    // 2. ENVIA PARA O SERVIDOR (Salva YAML e retorna CSV)
    const response = await $fetch<{ csv_content: string; message: string }>(
      "./api/upload_restore",
      {
        method: "POST",
        body: formData,
      },
    );

    logs.value.push(response.message); // "YAML configuration updated."

    // 3. PROCESSA O CSV (Se houver)
    const text = response.csv_content;

    if (!text) {
      logs.value.push("No entities (CSV) found to restore.");
      finishProcess();
      return;
    }

    // --- LÓGICA DE RESTAURAÇÃO DAS ENTIDADES (Mantida igual) ---
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    const total = lines.length;

    logs.value.push(`Restoring ${total} entity states...`);

    for (let i = 0; i < total; i++) {
      const line = lines[i];
      const parts = line.split(";");

      if (parts.length >= 2) {
        const entityId = parts[0].trim();
        let rawValue = parts[1].trim();

        // Remove aspas
        if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
          rawValue = rawValue.slice(1, -1);
        }

        currentEntity.value = entityId;

        try {
          // Chama a API de update individual (existente)
          await $fetch("./api/restore", {
            method: "POST",
            body: { entity_id: entityId, value: rawValue },
          });
        } catch (err) {
          console.error(err);
          logs.value.push(`ERROR on ${entityId}`);
          hasError.value = true;
        }
      }

      // Atualiza barra de progresso
      progress.value = Math.round(((i + 1) / total) * 100);
    }

    finishProcess();
  } catch (err: any) {
    console.error(err);
    logs.value.push(`CRITICAL ERROR: ${err.message}`);
    hasError.value = true;
    isProcessing.value = false; // Para caso de erro fatal
  }
};

const finishProcess = () => {
  logs.value.push("Process finished.");
  currentEntity.value = "Done!";
  progress.value = 100;

  setTimeout(() => {
    isProcessing.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }, 1500);
};

const close = () => {
  if (isProcessing.value) return;
  emit("close");
  logs.value = [];
  progress.value = 0;
};
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
  >
    <div
      class="bg-[#2b2b2b] w-full max-w-lg rounded-lg shadow-2xl border border-gray-700 p-6"
    >
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-semibold text-white flex items-center">
          <Icon
            icon="mdi:cloud-upload-outline"
            class="mr-2 text-esphome-accent"
          />
          Restore Configuration for: {{ device?.name }}
        </h3>
        <button
          @click="close"
          :disabled="isProcessing"
          class="text-gray-400 hover:text-white disabled:opacity-30"
        >
          <Icon icon="mdi:close" class="text-2xl" />
        </button>
      </div>

      <div class="space-y-6">
        <div
          v-if="!isProcessing && progress === 0"
          class="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-esphome-accent transition-colors cursor-pointer"
          @click="triggerFileUpload"
        >
          <input
            type="file"
            ref="fileInput"
            class="hidden"
            accept=".zip"
            @change="handleFileChange"
          />
          <Icon
            icon="mdi:folder-zip-outline"
            class="text-5xl text-gray-500 mx-auto mb-2"
          />
          <p class="text-gray-300 font-medium">
            Click to select the Backup ZIP
          </p>
          <p class="text-gray-500 text-sm mt-1">
            Contains: .yaml (config) & .csv (states)
          </p>
        </div>

        <div v-else>
          <div class="flex justify-between text-sm mb-1 text-gray-300">
            <span>{{ isProcessing ? "Restoring..." : "Done" }}</span>
            <span>{{ progress }}%</span>
          </div>

          <div class="w-full bg-gray-700 rounded-full h-4 overflow-hidden mb-2">
            <div
              class="bg-esphome-accent h-4 transition-all duration-300 ease-out"
              :style="{ width: progress + '%' }"
            ></div>
          </div>

          <p class="text-xs text-gray-400 font-mono truncate h-5">
            {{ currentEntity }}
          </p>

          <div
            v-if="logs.length > 0"
            class="mt-4 bg-black/30 p-2 rounded text-xs font-mono text-gray-400 max-h-32 overflow-y-auto"
          >
            <div
              v-for="(log, idx) in logs"
              :key="idx"
              :class="{
                'text-red-400':
                  log.includes('ERROR') || log.includes('CRITICAL'),
                'text-green-400':
                  log.includes('Done') || log.includes('finished'),
                'text-blue-300': log.includes('Uploading'),
              }"
            >
              > {{ log }}
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          v-if="!isProcessing"
          @click="close"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
