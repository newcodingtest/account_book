export function StorageNotice() {
  return (
    <aside className="notice storage-notice" aria-label="기록 보관 주의사항">
      <h3>기록이 사라질 수 있는 경우</h3>
      <p>
        일반 모드에서 브라우저나 홈 화면 앱을 닫았다가 같은 환경으로 다시 열면
        저장한 기록은 유지됩니다.
      </p>
      <ul>
        <li>
          <strong>사이트 데이터 삭제:</strong> 브라우저 설정에서 이 앱의 사이트
          데이터를 삭제하면 지출 기록도 삭제됩니다.
        </li>
        <li>
          <strong>시크릿·개인정보 보호 모드:</strong> 기록은 해당 모드가 종료될
          때 삭제될 수 있어요. 계속 보관할 기록은 일반 모드에서 입력하세요.
        </li>
        <li>
          <strong>기기·브라우저·앱 주소 변경:</strong> 기존 기록이 자동으로
          이동하지 않아 보이지 않을 수 있어요. JSON 백업으로 직접 옮겨
          복원하세요.
        </li>
        <li>
          <strong>브라우저의 저장소 정리:</strong> 저장 공간 부족 등의 이유로
          기록이 삭제될 수 있어요.
        </li>
      </ul>
      <p>
        <strong>
          사이트 데이터를 삭제하거나 사용 환경을 바꾸기 전에 JSON 백업을
          내보내세요.
        </strong>{" "}
        백업 파일이 실제로 저장됐는지 확인하고 안전한 별도 위치에 보관하세요.
      </p>
    </aside>
  );
}
