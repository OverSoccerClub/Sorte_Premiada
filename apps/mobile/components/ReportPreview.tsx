import React from "react";
import { View, Text, Image } from "react-native";
import tw from "../lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { FinanceSummary } from "../services/finance.service";

interface ReportPreviewProps {
    data: FinanceSummary;
    date: Date;
    isCapture?: boolean;
    companyName?: string;
    companyLogoUrl?: string;
}

export function ReportPreview({ data, date, isCapture = false, companyName = "Sorte Premiada", companyLogoUrl }: ReportPreviewProps) {
    const formatDate = (date: Date) => date.toLocaleString('pt-BR');
    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return `R$ ${num.toFixed(2).replace('.', ',')}`;
    };

    // Style adjustment for thermal printing (Scale Y to avoid stretching)
    const containerStyle = isCapture ? {
        transform: [
            { scaleX: 1.0 },
            { scaleY: 0.8 } // Correct aspect ratio for thermal printers
        ],
        width: '100%' as any,
        padding: 0,
        marginVertical: 0
    } : { padding: 16 };

    return (
        <View style={[tw`bg-white w-full overflow-hidden`, containerStyle, !isCapture && tw`rounded-sm shadow-xl`]}>

            {/* Header with Logo */}
            <View style={tw`items-center border-b-[1px] border-dashed border-black pb-2 mb-2 bg-white`}>
                {companyLogoUrl ? (
                    <Image
                        source={{ uri: companyLogoUrl }}
                        style={{ width: isCapture ? 80 : 60, height: isCapture ? 80 : 60, resizeMode: 'contain', marginBottom: 8 }}
                    />
                ) : (
                    <Ionicons name="receipt-outline" size={isCapture ? 32 : 28} color="#000" style={tw`mb-1`} />
                )}
                <Text style={[tw`${isCapture ? 'text-3xl' : 'text-xl'} text-black text-center uppercase tracking-widest`, { fontFamily: 'Roboto_900Black' }]}>{companyName}</Text>
                <Text style={[tw`${isCapture ? 'text-xs' : 'text-[10px]'} text-black text-center uppercase tracking-widest`, { fontFamily: 'Roboto_700Bold' }]}>Fechamento de Caixa</Text>
            </View>

            {/* Date */}
            <View style={tw`mb-3 items-center`}>
                <Text style={tw`text-xs text-black uppercase font-bold`}>{formatDate(date)}</Text>
            </View>

            {/* Financial Summary */}
            <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={[tw`text-xs text-black`, { fontFamily: 'Roboto_700Bold' }]}>VENDAS:</Text>
                    <Text style={[tw`text-xs text-black`, { fontFamily: 'Roboto_700Bold' }]}>{formatCurrency(data.totalSales)}</Text>
                </View>
                <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={[tw`text-xs text-black`, { fontFamily: 'Roboto_700Bold' }]}>CRÉDITOS:</Text>
                    <Text style={[tw`text-xs text-black`, { fontFamily: 'Roboto_700Bold' }]}>{formatCurrency(data.totalCredits)}</Text>
                </View>
                <View style={tw`flex-row justify-between mb-3`}>
                    <Text style={[tw`text-xs text-black`, { fontFamily: 'Roboto_700Bold' }]}>DÉBITOS:</Text>
                    <Text style={[tw`text-xs text-black`, { fontFamily: 'Roboto_700Bold' }]}>{formatCurrency(data.totalDebits)}</Text>
                </View>

                <View style={tw`border-t-[1px] border-dashed border-black my-2`} />

                <View style={tw`flex-row justify-between items-center mt-1`}>
                    <Text style={tw`text-base font-bold text-black uppercase`}>SALDO FINAL:</Text>
                    <Text style={tw`text-xl font-bold text-black`}>{formatCurrency(data.finalBalance)}</Text>
                </View>
            </View>

            {/* Separator */}
            <View style={tw`border-b-[1px] border-dashed border-black mb-4`} />

            {/* Transactions List */}
            {data.transactions && data.transactions.length > 0 && (
                <View style={tw`mb-4`}>
                    <Text style={tw`text-[10px] font-bold text-center text-black uppercase mb-2`}>Movimentações</Text>
                    {data.transactions.map((t) => (
                        <View key={t.id} style={tw`flex-row justify-between mb-1`}>
                            <Text style={tw`text-[10px] text-black w-2/3 uppercase`}>
                                {t.type === 'CREDIT' ? '+' : '-'} {t.description.substring(0, 20)}
                            </Text>
                            <Text style={tw`text-[10px] font-bold text-black`}>
                                {formatCurrency(t.amount)}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Signature Area */}
            <View style={tw`mt-8 items-center`}>
                <View style={tw`w-3/4 border-b-[1px] border-black mb-1`} />
                <Text style={tw`text-[10px] font-bold text-black uppercase`}>Assinatura Cambista</Text>
            </View>

            {/* Footer */}
            <View style={tw`items-center mt-4 mb-4`}>
                <Text style={tw`text-[10px] text-black text-center uppercase`}>
                    Relatório gerado em {new Date().toLocaleTimeString()}
                </Text>
                <Text style={tw`text-[10px] text-black text-center font-bold mt-1`}>
                    Boa Sorte!
                </Text>
            </View>
        </View>
    );
}
