import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import tw from "../lib/tailwind";
import { Announcement } from "../services/announcements.service";

interface AnnouncementCardProps {
    announcement: Announcement;
    onClose: (id: string) => void;
}

export function AnnouncementCard({ announcement, onClose }: AnnouncementCardProps) {
    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'ALERT':
                return {
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/50',
                    text: 'text-red-500',
                    icon: 'alert-circle'
                };
            case 'WARNING':
                return {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/50',
                    text: 'text-amber-500',
                    icon: 'warning'
                };
            case 'SUCCESS':
                return {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/50',
                    text: 'text-emerald-500',
                    icon: 'checkmark-circle'
                };
            default:
                return {
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/50',
                    text: 'text-blue-500',
                    icon: 'information-circle'
                };
        }
    };

    const styles = getTypeStyles(announcement.type);

    return (
        <View style={tw`w-[90%] mt-4 p-4 rounded-2xl border ${styles.bg} ${styles.border} self-center`}>
            <View style={tw`flex-row justify-between items-start mb-2`}>
                <View style={tw`flex-row items-center flex-1 pr-4`}>
                    <Ionicons name={styles.icon as any} size={20} color={styles.text === 'text-red-500' ? '#ef4444' : styles.text === 'text-amber-500' ? '#f59e0b' : styles.text === 'text-emerald-500' ? '#10b981' : '#3b82f6'} style={tw`mr-2`} />
                    <Text style={tw`font-bold ${styles.text} text-base`}>{announcement.title}</Text>
                </View>
                <TouchableOpacity onPress={() => onClose(announcement.id)}>
                    <Ionicons name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
            </View>
            <Text style={tw`text-gray-300 text-sm leading-5`}>{announcement.content}</Text>
        </View>
    );
}
