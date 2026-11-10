import { render } from '@testing-library/react-native';
import React from 'react';
import { ThemedText } from '../../components/themed-text';

describe('ThemedText', () => {
	it('renders correctly with default props', () => {
		const { getByText } = render(<ThemedText>Hola Mundo</ThemedText>);

		const textElement = getByText('Hola Mundo');

		expect(textElement).toBeTruthy();
	});

	it('applies the correct style for the "title" type', () => {
		const { getByText } = render(<ThemedText type='title'>Título de Prueba</ThemedText>);
		const textElement = getByText('Título de Prueba');

		// Verifica que el estilo del título se haya aplicado
		expect(textElement.props.style).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					// El componente usa fontSize 42 para el tipo 'title'
					fontSize: 42,
				}),
			]),
		);
	});
});
