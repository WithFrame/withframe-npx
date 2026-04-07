import type { Command } from 'commander';
import {
  asClass,
  asFunction,
  asValue,
  createContainer,
  InjectionMode,
  type AwilixContainer,
} from 'awilix';
import { AuthService } from '@/api/authService';
import { ComponentService } from '@/api/componentService';
import { InitService } from '@/api/initService';
import { AddCommand, InitCommand, LoginCommand, LogoutCommand } from '@/commands';
import { CliApp } from '@/core/CliApp';
import { CommandRegistry } from '@/core/CommandRegistry';
import { TokenStore } from '@/lib/tokenStore';
import { RegistryClient } from '@/api/RegistryClient';
import { ProjectComponentService } from '@/services/projectComponentService';

export interface AppCradle {
  program: Command;
  tokenStore: TokenStore;
  registryClient: RegistryClient;
  authService: AuthService;
  initService: InitService;
  projectComponentService: ProjectComponentService;
  componentService: ComponentService;
  initCommand: InitCommand;
  loginCommand: LoginCommand;
  logoutCommand: LogoutCommand;
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
    projectComponentService: asClass(ProjectComponentService).singleton(),
    componentService: asClass(ComponentService).singleton(),
    initCommand: asClass(InitCommand).singleton(),
    loginCommand: asClass(LoginCommand).singleton(),
    logoutCommand: asClass(LogoutCommand).singleton(),
    addCommand: asClass(AddCommand).singleton(),
    commandRegistry: asFunction(
      (
        initCommand: InitCommand,
        loginCommand: LoginCommand,
        logoutCommand: LogoutCommand,
        addCommand: AddCommand,
      ) => new CommandRegistry([initCommand, loginCommand, logoutCommand, addCommand]),
    ).singleton(),
    cliApp: asClass(CliApp).singleton(),
  });

  return container;
};
