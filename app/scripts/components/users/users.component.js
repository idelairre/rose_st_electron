import { Component, Inject, Resolve } from 'ng-forward';
import Auth from 'j-toker';
import AuthenticationService from '../../services/authentication.service';
import User from './user.model';
import Table, { TableComponent } from '../table/table.component';
import ModalService from '../../services/modal.service';
import 'angular-password';
import 'babel-polyfill';
import 'reflect-metadata';

@Component({
  selector: 'users',
  controllerAs: 'Users',
  template: require('./users.html'),
  providers: ['ngMessages', 'ngPassword', AuthenticationService, ModalService],
  directives: [Table]
})

@Inject('$mdDialog', 'users', AuthenticationService, ModalService)
export default class Users extends TableComponent {
  @Resolve()
  static users() {
    return User.query();
  }

  constructor($mdDialog, users, AuthenticationService, ModalService) {
    super(ModalService);
    this.authService = AuthenticationService;

    this.fields = ['id', 'email', 'name', 'posts', 'sign_in_count', 'confirmed', 'created_at', 'updated_at'];

    this.options.actions = (::this.evalAdmin() ? ['add', 'edit', 'delete', 'deleteAll'] : []);
    this.options.selectParam = 'email';
    this.options.filterFields = {
      created_at: 'date',
      updated_at: 'date'
    };

    this.model = User;
    this.users = users;
  }

  add(event) {
    let locals = {
      action: 'Create',
      object: new User()
    };
    this.modalService.addDialog(locals).then(::this.handleSubmit);
  }

  edit(event) {
    let user = this.getSelected();
    let locals = {
      action: 'Update',
      object: user
    };
    this.modalService.edit(locals).then(::this.handleSubmit);
  }

  handleRegister(response) {
    this.modalService.hide();
    console.log(response);
    this.modalService.success('User', response);
  }

  handleSubmit(slug) {
    console.log(slug);
    let user = slug.objectSlug;
    let action = slug.action;
    try {
      if (action === 'Update') {
        user.save();
      } else if (action === 'Create') {
        this.authService.register(userSlug).then(::this.handleRegister).fail(::this.handleErrors);
      }
    } catch (error) {
      this.handleErrors(error);
    }
  }
}
