import React from "react";
import { View, Text } from "react-native";
import tw from "../lib/tailwind";
import { Ionicons } from "@expo/vector-icons";
import { FinanceSummary } from "../services/finance.service";

interface ReportPreviewProps {
    data: FinanceSummary;
    date: Date;
}

export function ReportPreview({ data, date }: ReportPreviewProps) {
    const formatDate = (date: Date) => date.toLocaleString('pt-BR');
    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return `R$ ${num.toFixed(2).replace('.', ',')}`;
    };

    return (
        <View style={tw`bg-white p-4 rounded-sm shadow-xl w-full max-w-[340px] overflow-hidden`}>
            {/* Paper Tear Effect (Top) */}
            <View style={tw`absolute top-0 left-0 right-0 h-2 bg-gray-800 opacity-10`} />

            {/* Header */}
            <View style={tw`items-center border-b-2 border-dashed border-gray-300 pb-3 mb-3`}>
                <Ionicons name="receipt-outline" size={28} color="#000" style={tw`mb-1`} />
                <Text style={tw`text-lg font-extrabold text-black uppercase tracking-tighter`}>FECHAMENTO</Text>
                <Text style={tw`text-[10px] text-gray-500 uppercase tracking-widest`}>Relatório Diário</Text>
            </View>

            {/* Date */}
            <View style={tw`mb-3 items-center`}>
                <Text style={tw`text-xs font-bold text-black uppercase`}>{formatDate(date)}</Text>
            </View>

            {/* Financial Summary */}
            <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={tw`font-bold text-gray-600 text-xs`}>VENDAS:</Text>
                    <Text style={tw`font-mono font-bold text-black text-xs`}>{formatCurrency(data.totalSales)}</Text>
                </View>
                <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={tw`font-bold text-gray-600 text-xs`}>CRÉDITOS:</Text>
                    <Text style={tw`font-mono font-bold text-blue-600 text-xs`}>{formatCurrency(data.totalCredits)}</Text>
                </View>
                <View style={tw`flex-row justify-between mb-3`}>
                    <Text style={tw`font-bold text-gray-600 text-xs`}>DÉBITOS:</Text>
                    <Text style={tw`font-mono font-bold text-red-600 text-xs`}>{formatCurrency(data.totalDebits)}</Text>
                </View>

                <View style={tw`border-t border-dashed border-gray-300 my-2`} />

                <View style={tw`flex-row justify-between items-center mt-1`}>
                    <Text style={tw`text-base font-extrabold text-black uppercase`}>SALDO FINAL:</Text>
                    <Text style={tw`text-lg font-mono font-extrabold text-black`}>{formatCurrency(data.finalBalance)}</Text>
                </View>
            </View>

            {/* Separator */}
            <View style={tw`border-b-2 border-dashed border-gray-300 mb-4`} />

            {/* Transactions List */}
            {data.transactions && data.transactions.length > 0 && (
                <View style={tw`mb-4`}>
                    <Text style={tw`text-[10px] font-bold text-center text-black uppercase mb-2`}>Movimentações</Text>
                    {data.transactions.map((t) => (
                        <View key={t.id} style={tw`flex-row justify-between mb-1`}>
                            <Text style={tw`text-[9px] text-gray-600 w-2/3`}>
                                {t.type === 'CREDIT' ? '+' : '-'} {t.description.substring(0, 20)}
                            </Text>
                            <Text style={tw`text-[9px] font-mono text-black`}>
                                {formatCurrency(t.amount)}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Signature Area */}
            <View style={tw`mt-6 items-center`}>
                <View style={tw`w-3/4 border-b border-black mb-1`} />
                <Text style={tw`text-[9px] font-bold text-gray-500 uppercase`}>Assinatura Cambista</Text>
            </View>

            {/* Footer */}
            <View style={tw`items-center mt-4`}>
                <Text style={tw`text-[9px] text-gray-400 text-center`}>
                    Sorte Premiada - Gestão Financeira
                </Text>
            </View>

            {/* Paper Tear Effect (Bottom) - Visual only */}
            <View style={tw`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-gray-200 to-white/0`} />
        </View>
    );
}
