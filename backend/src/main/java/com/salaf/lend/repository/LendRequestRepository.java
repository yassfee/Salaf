package com.salaf.lend.repository;

import com.salaf.auth.entity.User;
import com.salaf.lend.entity.LendRequest;
import com.salaf.lend.entity.LendStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LendRequestRepository extends JpaRepository<LendRequest, Long> {
    List<LendRequest> findByLender(User lender);
    List<LendRequest> findByLenderAndStatus(User lender, LendStatus status);
    List<LendRequest> findByLenderAndStatusIn(User lender, List<LendStatus> statuses);
    Optional<LendRequest> findByIdAndLender(Long id, User lender);
}
