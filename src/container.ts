import type { Command } from 'commander';
import {
  asClass,
  asFunction,
  asValue,
  createContainer,
  InjectionMode,
  type AwilixContainer,
} from 'awilix';
import { AuthService } from '@/api/auth-service';
import { ComponentService } from '@/api/component-service';
import { InitService } from '@/api/init-service';
import { AddCommand, InitCommand, LoginCommand, LogoutCommand, ShotCommand } from '@/commands';
import { CliApp } from '@/core/cli-app';
import { CommandRegistry } from '@/core/command-registry';
import { TokenStore } from '@/lib/token-store';
import { RegistryClient } from '@/api/registry-client';
import { UploadService } from './api/upload-service';
import { UploadCommand } from './commands/upload';
import { ShotService } from './api/shot-service';

export interface AppCradle {
  program: Command;
  tokenStore: TokenStore;
  registryClient: RegistryClient;
  authService: AuthService;
  initService: InitService;
  componentService: ComponentService;
  uploadService: UploadService;
  shotService: ShotService;
  initCommand: InitCommand;
  loginCommand: LoginCommand;
  logoutCommand: LogoutCommand;
  uploadCommand: UploadCommand;
  shotCommand: ShotCommand;
  addCommand: AddCommand;
  commandRegistry: CommandRegistry;
  cliApp: CliApp;
}

export const createAppContainer = (program: Command): AwilixContainer<AppCradle> => {
  const container = createContainer<AppCradle>({
    injectionMode: InjectionMode.CLASSIC,
  });

  container.register({
    program: asValue(program),
    tokenStore: asClass(TokenStore).singleton(),
    registryClient: asClass(RegistryClient).singleton(),
    authService: asClass(AuthService).singleton(),
    initService: asClass(InitService).singleton(),
    componentService: asClass(ComponentService).singleton(),
    uploadService: asClass(UploadService).singleton(),
    shotService: asClass(ShotService).singleton(),
    initCommand: asClass(InitCommand).singleton(),
    loginCommand: asClass(LoginCommand).singleton(),
    logoutCommand: asClass(LogoutCommand).singleton(),
    uploadCommand: asClass(UploadCommand).singleton(),
    shotCommand: asClass(ShotCommand).singleton(),
    addCommand: asClass(AddCommand).singleton(),
    commandRegistry: asFunction(
      (
        initCommand: InitCommand,
        loginCommand: LoginCommand,
        logoutCommand: LogoutCommand,
        addCommand: AddCommand,
        uploadCommand: UploadCommand,
        shotCommand: ShotCommand,
      ) =>
        new CommandRegistry([
          initCommand,
          loginCommand,
          logoutCommand,
          addCommand,
          uploadCommand,
          shotCommand,
        ]),
    ).singleton(),
    cliApp: asClass(CliApp).singleton(),
  });

  return container;
};
