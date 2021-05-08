import React from "react";
import {
  Button,
  Popover,
  Whisper,
  Form,
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  ButtonToolbar,
  Schema,
} from "rsuite";

function Speaker({ ...props }) {
  const { StringType } = Schema.Types;
  const model = Schema.Model({
    email: StringType()
      .isEmail("Please enter a valid email address.")
      .isRequired("This field is required."),
    password: StringType().isRequired("This field is required."),
  });

  const onChange = (val) => {
    console.log(val);
  };

  return (
    <Popover style={{ backgroundColor: "lightgray" }} {...props}>
      <Form model={model}>
        <FormGroup>
          <ControlLabel>
            <b>Email: </b>
          </ControlLabel>
          <FormControl name="email" type="email" />
          <HelpBlock tooltip>Required</HelpBlock>
        </FormGroup>
        <FormGroup>
          <ControlLabel>
            <b>Password: </b>
          </ControlLabel>
          <FormControl name="password" type="password" />
        </FormGroup>
        <FormGroup>
          <ButtonToolbar>
            <Button appearance="primary" type="submit">
              Sign in
            </Button>
            <Button appearance="subtle">Signup</Button>
          </ButtonToolbar>
        </FormGroup>
      </Form>
    </Popover>
  );
}

function Login() {
  return (
    <Whisper trigger="click" placement="bottom" speaker={<Speaker />}>
      <Button appearance="ghost">Login</Button>
    </Whisper>
  );
}

export default Login;
