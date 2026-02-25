package com.salaf.lend.repository;

import com.salaf.lend.entity.LendRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LendRequestRepository extends JpaRepository<LendRequest, Long> {
    // TODO: Add query methods:
    //   List<LendRequest> findByLender(User lender)
    //   List<LendRequest> findByLenderAndStatus(User lender, LendStatus status)
    //   Optional<LendRequest> findByIdAndLender(Long id, User lender)
}
