<template>
    <div class="bg-white h-full w-96 border-l border-stone-200 flex flex-col">
        <div
            class="flex items-center justify-between p-4 border-b border-stone-200"
        >
            <h3 class="font-semibold text-lg">
                Participants ({{
                    participantsStore.inMeetingParticipants.length +
                    lobbyParticipants.length
                }})
            </h3>
            <BaseButton
                variant="ghost"
                size="sm"
                class="!h-auto !p-2 rounded-full"
                @click="$emit('close')"
            >
                <font-awesome-icon icon="xmark" class="w-4 h-4" />
            </BaseButton>
        </div>

        <div
            v-if="lobbyParticipants.length && isModerator"
            class="p-4 bg-yellow-50 border-b border-yellow-200"
        >
            <p class="text-sm font-medium text-yellow-800 mb-2">
                In Lobby ({{ lobbyParticipants.length }})
            </p>
            <div class="space-y-2">
                <div
                    v-for="participant in lobbyParticipants"
                    :key="participant.id"
                    class="flex items-center justify-between"
                >
                    <span class="text-sm">{{ participant.name }}</span>
                    <BaseButton
                        size="sm"
                        @click="$emit('admit', participant.id)"
                    >
                        Admit
                    </BaseButton>
                </div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-2">
            <ParticipantCard
                v-for="participant in inMeetingParticipants"
                :key="participant.id"
                :participant="participant"
            >
                <template v-if="isModerator && !participant.isSelf" #actions>
                    <BaseButton
                        v-if="!participant.isAudioMuted"
                        variant="ghost"
                        size="sm"
                        class="!h-auto !p-2 rounded-full"
                        title="Mute audio"
                        @click="$emit('muteAudio', participant.id)"
                    >
                        <font-awesome-icon
                            icon="microphone-slash"
                            class="w-4 h-4"
                        />
                    </BaseButton>
                    <BaseButton
                        v-if="!participant.isVideoMuted"
                        variant="ghost"
                        size="sm"
                        class="!h-auto !p-2 rounded-full"
                        title="Mute video"
                        @click="$emit('muteVideo', participant.id)"
                    >
                        <font-awesome-icon
                            icon="video-slash"
                            class="w-4 h-4"
                        />
                    </BaseButton>
                    <BaseButton
                        variant="ghost"
                        size="sm"
                        :class="[
                            '!h-auto !p-2 rounded-full',
                            isParticipantPinned(participant.id)
                                ? 'text-blue-500'
                                : '',
                        ]"
                        :title="
                            isParticipantPinned(participant.id)
                                ? 'Unpin participant'
                                : 'Pin participant'
                        "
                        @click="handlePinToggle(participant.id)"
                    >
                        <font-awesome-icon
                            :icon="
                                isParticipantPinned(participant.id)
                                    ? 'bookmark'
                                    : ['far', 'bookmark']
                            "
                            class="w-4 h-4"
                        />
                    </BaseButton>
                    <BaseButton
                        variant="ghost"
                        size="sm"
                        class="!h-auto !p-2 rounded-full text-red-500"
                        title="Remove participant"
                        @click="$emit('remove', participant.id)"
                    >
                        <font-awesome-icon icon="user-xmark" class="w-4 h-4" />
                    </BaseButton>
                </template>
            </ParticipantCard>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useParticipantsStore } from '@/storage/participants';
import ParticipantCard from './ParticipantCard.vue';
import BaseButton from '@/components/base/BaseButton.vue';

defineProps({
    isModerator: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits([
    'close',
    'admit',
    'muteAudio',
    'muteVideo',
    'pin',
    'unpin',
    'remove',
]);

const participantsStore = useParticipantsStore();

const inMeetingParticipants = computed(() => {
    const participants = participantsStore.inMeetingParticipants;

    // Sort: local participant first, then alphabetically by name
    return [...participants].sort((a, b) => {
        if (a.isSelf) return -1;
        if (b.isSelf) return 1;
        return a.name.localeCompare(b.name);
    });
});

const lobbyParticipants = computed(() => participantsStore.lobbyParticipants);

const isParticipantPinned = (participantId) => {
    return participantsStore.pinnedParticipantId === participantId;
};

const handlePinToggle = (participantId) => {
    if (isParticipantPinned(participantId)) {
        emit('unpin', participantId);
    } else {
        emit('pin', participantId);
    }
};
</script>
