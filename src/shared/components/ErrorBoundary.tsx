import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main>
        <h1>화면을 표시하지 못했어요</h1>
        <p role="alert">
          저장소 또는 기록을 확인해야 합니다. 브라우저 데이터를 삭제하지 말고
          다시 불러오세요.
        </p>
        <button onClick={() => location.reload()}>다시 불러오기</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
