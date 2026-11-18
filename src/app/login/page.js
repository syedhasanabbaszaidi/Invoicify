import { LoginForm } from "./login-form";
export default function LoginPage() {
    return <LoginForm isDev={process.env.NODE_ENV !== "production"}/>;
}
