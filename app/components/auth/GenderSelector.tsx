import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';

type Gender = 'female' | 'male' | 'prefer-not-to-say';

interface Props {
    onSelect: (gender: Gender) => void;
    selected?: Gender | null;
}

type Option = {
    readonly id: Gender;
    readonly i18nKey: string; 
    readonly image?: ImageSourcePropType;
};

const options: readonly Option[] = [
    { 
        id: 'female', 
        i18nKey: 'female', 
        image: require('@/assets/images/female_black.png') 
    },
    { 
        id: 'male', 
        i18nKey: 'male', 
        image: require('@/assets/images/man_black.png') 
    },
    { 
        id: 'prefer-not-to-say', 
        i18nKey: 'preferNotToSay' 
    },
];

export function GenderSelector({ onSelect, selected }: Props) {
    const { t } = useTranslation();
    const [internalSelected, setInternalSelected] = useState<Gender | null>(selected ?? null);

    const handlePress = (gender: Gender) => {
        setInternalSelected(gender);
        onSelect(gender);
    };

    useEffect(() => {
        setInternalSelected(selected ?? null);
    }, [selected]);

    return (
        <View className='w-full gap-y-4'>
            {options.map((option) => (
                <TouchableOpacity
                    key={option.id}
                    onPress={() => handlePress(option.id)}
                    className={`
                        w-full flex-row items-center justify-between rounded-2xl p-4
                        ${internalSelected === option.id ? 'bg-gray-800' : 'bg-white'}
                    `}>
                    
                    <View className='flex-row items-center'>
                        <Text
                            className={`text-lg font-bold ${
                                internalSelected === option.id ? 'text-white' : 'text-black'
                            }`}>

                            {t(`register.genderSelector.${option.i18nKey}`)}
                        </Text>
                    </View>

                    <View className='flex-row items-center'>
                        {option.image && (
                            <Image
                                source={option.image}
                                style={{ width: 60, height: 60, resizeMode: 'contain' }}
                            />
                        )}
                        <View
                            className={`ml-4 h-6 w-6 items-center justify-center rounded-full border-2 ${
                                internalSelected === option.id
                                    ? 'border-green-500'
                                    : 'border-gray-400'
                            }`}>
                            {internalSelected === option.id && (
                                <View className='h-3 w-3 rounded-full bg-green-500' />
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
}
