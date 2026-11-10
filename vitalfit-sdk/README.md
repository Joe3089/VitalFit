# VitalFit API's SDK

## The VitalFit SDK provides a set of services to interact with the VitalFit API. It includes support for authentication, managing entities like branches, services, equipments, etc. . .

## Using the SDK

### Installation

```sh
npm install @vitalFit/sdk@latest
```

### `VitalFit` Class

The `VitalFit` class is the main entry point for interacting with the SDK. It provides access to various services for managing entities.

#### Singleton Pattern

The `VitalFit` class uses the Singleton pattern. Use the `getInstance` method to get the single instance of the class.

```typescript
import { VitalFit } from '@vitalFit/sdk';

const VitalFit = VitalFit.getInstance(true); // Pass `true` for development mode
```
